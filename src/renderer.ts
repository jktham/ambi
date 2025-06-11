import type { Camera } from "./camera";
import { fragModes, Resources, vertModes } from "./resources";
import type { Scene } from "./scene";

export class Renderer {
    private canvas: HTMLCanvasElement;
    private device!: GPUDevice;
    private context!: GPUCanvasContext;
    private presentationFormat!: GPUTextureFormat;
    private pipeline!: GPURenderPipeline;
    private renderPassDescriptor!: GPURenderPassDescriptor;

    private vertexBuffer: GPUBuffer[] = [];
    private defaultUniformBuffer: GPUBuffer[] = [];
    private defaultUniformData: Float32Array[] = [];
    private vertUniformBuffer: GPUBuffer[] = [];
    private fragUniformBuffer: GPUBuffer[] = [];
    private uniformBindGroup: GPUBindGroup[] = [];
    private textureBindGroup: GPUBindGroup[] = [];
    private resources: Resources = new Resources();

    private colorFrameBuffer!: GPUTexture;
    private posDepthFrameBuffer!: GPUTexture;
    private normalMaskFrameBuffer!: GPUTexture;
    private postPipeline!: GPURenderPipeline;
    private postFrameBuffersBindGroup!: GPUBindGroup;
    private postRenderPassDescriptor!: GPURenderPassDescriptor;

    constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
    }

    public async init() {
        await this.getGPUDevice();
        this.configureCanvas();
        await this.configurePipeline();
        await this.configurePostPipeline();
        this.configureFrameBufferTextures();
        this.configureRenderPassDescriptor();
        this.configurePostRenderPassDescriptor();
    }

	private async getGPUDevice() {
        try {
            var adapter = await navigator.gpu?.requestAdapter(); // may throw error in firefox
            const device = await adapter?.requestDevice();
            if (!device) {
                throw new Error("no webgpu device");
            }
            if (device.adapterInfo.isFallbackAdapter) {
                alert("fallback to cpu simulated device, bad performance likely, try chrome://flags/#enable-vulkan");
            }
            this.device = device;

        } catch (e) {
            console.error(e);
            alert("no webgpu support, try chromium based browser with chrome://flags/#enable-unsafe-webgpu");
            throw new Error("no webgpu support");
        }
    }

	private configureCanvas() {
        var context = this.canvas.getContext("webgpu");
        if (!context) {
            return;
        }
        this.context = context;

        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device: this.device,
            format: this.presentationFormat
        });
    }

    private async configurePipeline() {
        const vertexShader = this.device.createShaderModule({
            label: "vertex shader",
            code: await this.resources.loadShader("world_base.vert.wgsl"),
        });
        const fragmentShader = this.device.createShaderModule({
            label: "fragment shader",
            code: await this.resources.loadShader("world_base.frag.wgsl"),
        });
        const depthStencilState: GPUDepthStencilState = {
            depthWriteEnabled: true,
            depthCompare: 'less' as GPUCompareFunction,
            format: 'depth24plus-stencil8' as GPUTextureFormat,
        }

        this.pipeline = this.device.createRenderPipeline({
            label: "render pipeline",
            layout: "auto",
            vertex: {
                module: vertexShader,
                buffers: [
                    {
                        arrayStride: 12 * 4,
                        attributes: [
                            {shaderLocation: 0, offset: 0, format: "float32x3"}, // pos
                            {shaderLocation: 1, offset: 3 * 4, format: "float32x3"}, // normal
                            {shaderLocation: 2, offset: 6 * 4, format: "float32x4"}, // color
                            {shaderLocation: 3, offset: 10 * 4, format: "float32x2"}, // uv
                        ]
                    }
                ]
            },
            fragment: {
                module: fragmentShader,
                targets: [
                    { format: "rgba8unorm" }, 
                    { format: "rgba32float" }, 
                    { format: "rgba8unorm" },
                ]
            },
            depthStencil: depthStencilState,
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "none"
            }
        });
    }

    private async configurePostPipeline() {
        const vertexShader = this.device.createShaderModule({
            label: "vertex shader",
            code: await this.resources.loadShader("post_base.vert.wgsl"),
        });
        const fragmentShader = this.device.createShaderModule({
            label: "fragment shader",
            code: await this.resources.loadShader("post_base.frag.wgsl"),
        });

        this.postPipeline = this.device.createRenderPipeline({
            label: "post pipeline",
            layout: "auto",
            vertex: {
                module: vertexShader,
            },
            fragment: {
                module: fragmentShader,
                targets: [
                    { format: this.presentationFormat }
                ]
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "back"
            }
        });
    }

    private configureRenderPassDescriptor() {
        const depthTextureDesc: GPUTextureDescriptor = {
            size: { width: this.canvas.width, height: this.canvas.height },
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        };
        const depthTexture = this.device.createTexture(depthTextureDesc);

        this.renderPassDescriptor = {
            label: "render pass descriptor",
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.colorFrameBuffer.createView()
            }, {
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.posDepthFrameBuffer.createView()
            }, {
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.normalMaskFrameBuffer.createView()
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                stencilClearValue: 0,
                stencilLoadOp: 'clear',
                stencilStoreOp: 'store'
            }
        };
    }

    private configurePostRenderPassDescriptor() {
        this.postRenderPassDescriptor = {
            label: "post render pass descriptor",
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.context.getCurrentTexture().createView()
            }]
        };
    }

    private configureFrameBufferTextures() {
        this.colorFrameBuffer = this.device.createTexture({
            label: "color framebuffer",
            size: [this.canvas.width, this.canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        });
        this.posDepthFrameBuffer = this.device.createTexture({
            label: "pos/depth framebuffer",
            size: [this.canvas.width, this.canvas.height],
            format: "rgba32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        });
        this.normalMaskFrameBuffer = this.device.createTexture({
            label: "normal/mask framebuffer",
            size: [this.canvas.width, this.canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        });

        this.postFrameBuffersBindGroup = this.device.createBindGroup({
            layout: this.postPipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: this.colorFrameBuffer.createView() },
                { binding: 1, resource: this.posDepthFrameBuffer.createView() },
                { binding: 2, resource: this.normalMaskFrameBuffer.createView() },
            ],
        });
    }

    public async loadScene(scene: Scene) {
        for (let i=0; i<scene.worldObjects.length; i++) {
            // vertex buffer
            const vertexData = await this.resources.loadMesh(scene.worldObjects[i].mesh);
            this.vertexBuffer.push(this.device.createBuffer({
                label: "vertex buffer",
                size: vertexData.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.vertexBuffer[i], 0, vertexData);

            // default uniform buffer
            const defaultUniformLength = 88;
            this.defaultUniformData.push(new Float32Array(defaultUniformLength));
            this.defaultUniformBuffer.push(this.device.createBuffer({
                label: "default uniform buffer",
                size: defaultUniformLength * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.defaultUniformBuffer[i], 0, this.defaultUniformData[i]);

            // custom uniform buffers
            const vertUniformLength = 16;
            this.vertUniformBuffer.push(this.device.createBuffer({
                label: "vert uniform buffer",
                size: vertUniformLength * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.vertUniformBuffer[i], 0, scene.worldObjects[i].vertUniforms);

            const fragUniformLength = 16;
            this.fragUniformBuffer.push(this.device.createBuffer({
                label: "frag uniform buffer",
                size: fragUniformLength * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.fragUniformBuffer[i], 0, scene.worldObjects[i].fragUniforms);

            this.uniformBindGroup.push(this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.defaultUniformBuffer[i] }},
                    { binding: 1, resource: { buffer: this.vertUniformBuffer[i] }},
                    { binding: 2, resource: { buffer: this.fragUniformBuffer[i] }},
                ],
            }));

            // texture buffer
            const textureData = await this.resources.loadTexture(scene.worldObjects[i].texture);
            const textureBuffer = this.device.createTexture({
                label: "texture buffer",
                size: [textureData.width, textureData.height],
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
            this.device.queue.writeTexture(
                {texture: textureBuffer},
                textureData.data,
                {bytesPerRow: 4 * textureData.width},
                {width: textureData.width, height: textureData.height}
            );

            const sampler = this.device.createSampler();
            this.textureBindGroup.push(this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(1),
                entries: [
                    { binding: 0, resource: sampler },
                    { binding: 1, resource: textureBuffer.createView() },
                ],
            }));
        }
    }

    public drawScene(scene: Scene, camera: Camera, time: number, frame: number) {
        for (let i=0; i<scene.worldObjects.length; i++) {
            this.defaultUniformData[i][0] = time;
            this.defaultUniformData[i][1] = frame;
            this.defaultUniformData[i][2] = vertModes.indexOf(scene.worldObjects[i].vertMode);
            this.defaultUniformData[i][3] = fragModes.indexOf(scene.worldObjects[i].fragMode);
            this.defaultUniformData[i][4] = scene.worldObjects[i].ambientFactor;
            this.defaultUniformData[i][5] = scene.worldObjects[i].diffuseFactor;
            this.defaultUniformData[i][6] = scene.worldObjects[i].specularFactor;
            this.defaultUniformData[i][7] = scene.worldObjects[i].specularExponent;
            this.defaultUniformData[i].subarray(8, 8+3).set(scene.worldObjects[i].lightPos.data);
            this.defaultUniformData[i].subarray(12, 12+4).set(scene.worldObjects[i].lightColor.data);
            this.defaultUniformData[i].subarray(16, 16+3).set(camera.position.data);
            this.defaultUniformData[i].subarray(20, 20+4).set(scene.worldObjects[i].color.data);
            this.defaultUniformData[i].subarray(24, 24+16).set(scene.worldObjects[i].model.transpose().data);
            this.defaultUniformData[i].subarray(40, 40+16).set(camera.view.transpose().data);
            this.defaultUniformData[i].subarray(56, 56+16).set(camera.projection.transpose().data);
            this.defaultUniformData[i].subarray(72, 72+16).set(scene.worldObjects[i].model.inverse().data);
            this.device.queue.writeBuffer(this.defaultUniformBuffer[i], 0, this.defaultUniformData[i]);

            this.device.queue.writeBuffer(this.vertUniformBuffer[i], 0, scene.worldObjects[i].vertUniforms);
            this.device.queue.writeBuffer(this.fragUniformBuffer[i], 0, scene.worldObjects[i].fragUniforms);
        }

        const encoder = this.device.createCommandEncoder({ label: "render encoder" });
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        for (let i=0; i<scene.worldObjects.length; i++) {
            pass.setPipeline(this.pipeline);
            pass.setVertexBuffer(0, this.vertexBuffer[i]);
            pass.setBindGroup(0, this.uniformBindGroup[i]);
            pass.setBindGroup(1, this.textureBindGroup[i]);
            pass.draw(this.vertexBuffer[i].size / 4 / 12);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);

        const postEncoder = this.device.createCommandEncoder({ label: "post render encoder" });
        (this.postRenderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.context.getCurrentTexture().createView();
        const postPass = postEncoder.beginRenderPass(this.postRenderPassDescriptor);
        postPass.setPipeline(this.postPipeline);
        postPass.setBindGroup(2, this.postFrameBuffersBindGroup);
        postPass.draw(6);
        postPass.end();

        this.device.queue.submit([postEncoder.finish()]);
    }
}