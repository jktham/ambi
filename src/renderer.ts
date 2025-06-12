import type { Camera } from "./camera";
import { Resources } from "./resources";
import type { Scene } from "./scene";
import { BaseUniforms, PostBaseUniforms } from "./uniforms";
import { Vec2 } from "./vec";

export class Renderer {
    private canvas: HTMLCanvasElement;
    private device!: GPUDevice;
    private context!: GPUCanvasContext;
    private presentationFormat!: GPUTextureFormat;
    private renderPassDescriptor!: GPURenderPassDescriptor;
    private postRenderPassDescriptor!: GPURenderPassDescriptor;

    private colorFrameBuffer!: GPUTexture;
    private posDepthFrameBuffer!: GPUTexture;
    private normalMaskFrameBuffer!: GPUTexture;

    private pipelines: GPURenderPipeline[] = [];
    private vertexBuffers: GPUBuffer[] = [];
    private baseUniformBuffers: GPUBuffer[] = [];
    private vertUniformBuffers: GPUBuffer[] = [];
    private fragUniformBuffers: GPUBuffer[] = [];
    private uniformBindGroups: GPUBindGroup[] = [];
    private textureBindGroups: GPUBindGroup[] = [];

    private postPipeline!: GPURenderPipeline;
    private postBaseUniformBuffer!: GPUBuffer;
    private postUniformBuffer!: GPUBuffer;
    private postUniformBindGroup!: GPUBindGroup;
    private postFrameBufferBindGroup!: GPUBindGroup;

    private resources: Resources = new Resources();

    constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
    }

    public async init() {
        await this.getGPUDevice();
        this.configureCanvas();
        this.createFrameBufferTextures();
        this.configureRenderPass();
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

    private configureRenderPass() {
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
                clearValue: [0.5, 0.5, 0.5, 0.0],
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

    private createFrameBufferTextures() {
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
    }

    public async loadScene(scene: Scene) {
        await this.initWorld(scene);
        await this.initPost(scene);
    }

    public async loadPost(scene: Scene) {
        await this.initPost(scene);
    }

    private destroyWorldBuffers() {
        this.vertexBuffers.map(b => b.destroy());
        this.baseUniformBuffers.map(b => b.destroy());
        this.vertUniformBuffers.map(b => b.destroy());
        this.fragUniformBuffers.map(b => b.destroy());

        this.pipelines = [];
        this.vertexBuffers = [];
        this.baseUniformBuffers = [];
        this.vertUniformBuffers = [];
        this.fragUniformBuffers = [];
        this.uniformBindGroups = [];
        this.textureBindGroups = [];
    }

    private destroyPostBuffers() {
        this.postBaseUniformBuffer?.destroy();
        this.postUniformBuffer?.destroy();

        (this.postPipeline as any) = undefined;
        (this.postBaseUniformBuffer as any) = undefined;
        (this.postUniformBuffer as any) = undefined;
        (this.postUniformBindGroup as any) = undefined;
        (this.postFrameBufferBindGroup as any) = undefined;
    }

    private async initWorld(scene: Scene) {
        this.destroyWorldBuffers();

        for (let i=0; i<scene.worldObjects.length; i++) {
            // pipeline
            const vertexShader = this.device.createShaderModule({
                label: "vertex shader",
                code: await this.resources.loadShader(scene.worldObjects[i].vertShader),
            });
            const fragmentShader = this.device.createShaderModule({
                label: "fragment shader",
                code: await this.resources.loadShader(scene.worldObjects[i].fragShader),
            });
            const depthStencilState: GPUDepthStencilState = {
                depthWriteEnabled: true,
                depthCompare: 'less' as GPUCompareFunction,
                format: 'depth24plus-stencil8' as GPUTextureFormat,
            };

            this.pipelines.push(this.device.createRenderPipeline({
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
                        { format: "rgba8unorm" }, // color
                        { format: "rgba32float" }, // posDepth
                        { format: "rgba8unorm" }, // normalMask
                    ]
                },
                depthStencil: depthStencilState,
                primitive: {
                    topology: "triangle-list",
                    frontFace: "ccw",
                    cullMode: "none"
                }
            }));

            // vertex buffer
            const vertexData = await this.resources.loadMesh(scene.worldObjects[i].mesh);
            this.vertexBuffers.push(this.device.createBuffer({
                label: "vertex buffer",
                size: vertexData.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.vertexBuffers[i], 0, vertexData);

            // uniforms
            const baseUniformLength = new BaseUniforms().size;
            this.baseUniformBuffers.push(this.device.createBuffer({
                label: "base uniform buffer",
                size: baseUniformLength * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            }));

            const vertUniformLength = scene.worldObjects[i].vertUniforms.size;
            this.vertUniformBuffers.push(this.device.createBuffer({
                label: "vert uniform buffer",
                size: vertUniformLength * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            }));
            if (vertUniformLength > 0) {
                this.device.queue.writeBuffer(this.vertUniformBuffers[i], 0, scene.worldObjects[i].vertUniforms.toArray());
            }

            const fragUniformLength = scene.worldObjects[i].fragUniforms.size;
            this.fragUniformBuffers.push(this.device.createBuffer({
                label: "frag uniform buffer",
                size: fragUniformLength * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            }));
            if (fragUniformLength > 0) {
                this.device.queue.writeBuffer(this.fragUniformBuffers[i], 0, scene.worldObjects[i].fragUniforms.toArray());
            }

            let uniformBindings: GPUBindGroupEntry[] = [];
            uniformBindings.push({ binding: 0, resource: { buffer: this.baseUniformBuffers[i] }});
            if (vertUniformLength > 0) {
                uniformBindings.push({ binding: 1, resource: { buffer: this.vertUniformBuffers[i] }});
            }
            if (fragUniformLength > 0) {
                uniformBindings.push({ binding: 2, resource: { buffer: this.fragUniformBuffers[i] }});
            }

            this.uniformBindGroups.push(this.device.createBindGroup({
                layout: this.pipelines[i].getBindGroupLayout(0),
                entries: uniformBindings,
            }));

            // textures
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
            this.textureBindGroups.push(this.device.createBindGroup({
                layout: this.pipelines[i].getBindGroupLayout(1),
                entries: [
                    { binding: 0, resource: sampler },
                    { binding: 1, resource: textureBuffer.createView() },
                ],
            }));
        }
    }

    private async initPost(scene: Scene) {
        this.destroyPostBuffers();

        // post pipeline
        const postVertexShader = this.device.createShaderModule({
            label: "post vertex shader",
            code: await this.resources.loadShader("post/base.vert.wgsl"),
        });
        const postFragmentShader = this.device.createShaderModule({
            label: "post fragment shader",
            code: await this.resources.loadShader(scene.postShader),
        });

        this.postPipeline = this.device.createRenderPipeline({
            label: "post pipeline",
            layout: "auto",
            vertex: {
                module: postVertexShader,
            },
            fragment: {
                module: postFragmentShader,
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

        // post uniforms
        const postBaseUniformLength = new PostBaseUniforms().size;
        this.postBaseUniformBuffer = this.device.createBuffer({
            label: "post base uniform buffer",
            size: postBaseUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const postUniformLength = scene.postUniforms.size;
        this.postUniformBuffer = this.device.createBuffer({
            label: "post uniform buffer",
            size: postUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        if (postUniformLength > 0) {
            this.device.queue.writeBuffer(this.postUniformBuffer, 0, scene.postUniforms.toArray());
        }

        let postUniformBindings: GPUBindGroupEntry[] = [];
        postUniformBindings.push({ binding: 0, resource: { buffer: this.postBaseUniformBuffer }});
        if (postUniformLength > 0) {
            postUniformBindings.push({ binding: 1, resource: { buffer: this.postUniformBuffer }});
        }

        this.postUniformBindGroup = this.device.createBindGroup({
            layout: this.postPipeline.getBindGroupLayout(0),
            entries: postUniformBindings,
        });

        // framebuffer textures
        this.postFrameBufferBindGroup = this.device.createBindGroup({
            layout: this.postPipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: this.colorFrameBuffer.createView() },
                { binding: 1, resource: this.posDepthFrameBuffer.createView() },
                { binding: 2, resource: this.normalMaskFrameBuffer.createView() },
            ],
        });
    }

    public drawScene(scene: Scene, camera: Camera, time: number, frame: number) {
        // update world buffers
        for (let i=0; i<scene.worldObjects.length; i++) {
            let baseUniforms = new BaseUniforms();
            baseUniforms.time = time;
            baseUniforms.frame = frame;
            baseUniforms.color = scene.worldObjects[i].color;
            baseUniforms.viewPos = camera.position;
            baseUniforms.model = scene.worldObjects[i].model;
            baseUniforms.view = camera.view;
            baseUniforms.projection = camera.projection;
            baseUniforms.normal = scene.worldObjects[i].model.inverse().transpose();
            this.device.queue.writeBuffer(this.baseUniformBuffers[i], 0, baseUniforms.toArray());

            if (scene.worldObjects[i].vertUniforms.size > 0) {
                this.device.queue.writeBuffer(this.vertUniformBuffers[i], 0, scene.worldObjects[i].vertUniforms.toArray());
            }
            if (scene.worldObjects[i].fragUniforms.size > 0) {
                this.device.queue.writeBuffer(this.fragUniformBuffers[i], 0, scene.worldObjects[i].fragUniforms.toArray());
            }
        }

        // draw world
        const encoder = this.device.createCommandEncoder({ label: "render encoder" });
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        for (let i=0; i<scene.worldObjects.length; i++) {
            pass.setPipeline(this.pipelines[i]);
            pass.setVertexBuffer(0, this.vertexBuffers[i]);
            pass.setBindGroup(0, this.uniformBindGroups[i]);
            pass.setBindGroup(1, this.textureBindGroups[i]);
            pass.draw(this.vertexBuffers[i].size / 4 / 12);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);

        // update post buffers
        let postBaseUniforms = new PostBaseUniforms();
        postBaseUniforms.time = time;
        postBaseUniforms.frame = frame;
        postBaseUniforms.resolution = new Vec2(this.canvas.width, this.canvas.height);
        this.device.queue.writeBuffer(this.postBaseUniformBuffer, 0, postBaseUniforms.toArray());

        if (scene.postUniforms.size > 0) {
            this.device.queue.writeBuffer(this.postUniformBuffer, 0, scene.postUniforms.toArray());
        }

        // draw post
        (this.postRenderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.context.getCurrentTexture().createView();
        const postEncoder = this.device.createCommandEncoder({ label: "post render encoder" });
        const postPass = postEncoder.beginRenderPass(this.postRenderPassDescriptor);
        postPass.setPipeline(this.postPipeline);
        postPass.setBindGroup(0, this.postUniformBindGroup);
        postPass.setBindGroup(2, this.postFrameBufferBindGroup);
        postPass.draw(6);
        postPass.end();
        this.device.queue.submit([postEncoder.finish()]);
    }
}