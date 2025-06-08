import type { Camera } from "./camera";
import { Resources } from "./resources";
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
    private defaultUniformBindGroup: GPUBindGroup[] = [];
    private vertUniformBuffer: GPUBuffer[] = [];
    private vertUniformBindGroup: GPUBindGroup[] = [];
    private fragUniformBuffer: GPUBuffer[] = [];
    private fragUniformBindGroup: GPUBindGroup[] = [];
    private textureBindGroup: GPUBindGroup[] = [];
    private resources: Resources = new Resources();

    constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
    }

    public async init() {
        await this.getGPUDevice();
        this.configureCanvas();
        await this.configurePipeline();
        this.configureRenderPassDescriptor();
    }

    private fail(msg: string) {
        document.body.innerHTML = `<H1>${msg}</H1>`;
    }

	private async getGPUDevice() {
        var adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        if (!device) {
            this.fail("Browser does not support WebGPU");
            return;
        }

        this.device = device;
    }

	private configureCanvas() {
        var context = this.canvas.getContext("webgpu");
        if (!context) {
            this.fail("Failed to get canvas context");
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
            code: await this.resources.loadShader("world_vert.wgsl"),
        });
        const fragmentShader = this.device.createShaderModule({
            label: "fragment shader",
            code: await this.resources.loadShader("world_frag.wgsl"),
        });

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
                targets: [{ format: this.presentationFormat }]
            }
        });
    }

    private configureRenderPassDescriptor() {
        this.renderPassDescriptor = {
            label: "render pass descriptor",
            colorAttachments: [{
                clearValue: [0.05, 0.05, 0.05, 1.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.context.getCurrentTexture().createView()
            }]
        };
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
            const defaultUniformLength = 56;
            this.defaultUniformData.push(new Float32Array(defaultUniformLength));
            this.defaultUniformBuffer.push(this.device.createBuffer({
                label: "default uniform buffer",
                size: defaultUniformLength * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.defaultUniformBuffer[i], 0, this.defaultUniformData[i]);
            this.defaultUniformBindGroup.push(this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.defaultUniformBuffer[i] }},
                ],
            }));

            // custom uniform buffers
            const vertUniformLength = 16;
            this.vertUniformBuffer.push(this.device.createBuffer({
                label: "vert uniform buffer",
                size: vertUniformLength * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.vertUniformBuffer[i], 0, scene.worldObjects[i].vertUniforms);
            this.vertUniformBindGroup.push(this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(1),
                entries: [
                    { binding: 0, resource: { buffer: this.vertUniformBuffer[i] }},
                ],
            }));

            const fragUniformLength = 16;
            this.fragUniformBuffer.push(this.device.createBuffer({
                label: "frag uniform buffer",
                size: fragUniformLength * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.fragUniformBuffer[i], 0, scene.worldObjects[i].fragUniforms);
            this.fragUniformBindGroup.push(this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(2),
                entries: [
                    { binding: 0, resource: { buffer: this.fragUniformBuffer[i] }},
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
                layout: this.pipeline.getBindGroupLayout(3),
                entries: [
                    { binding: 0, resource: sampler },
                    { binding: 1, resource: textureBuffer.createView() },
                ],
            }));
        }
    }

    public drawScene(scene: Scene, camera: Camera, time: number, frame: number) {
        (this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.context.getCurrentTexture().createView();

        for (let i=0; i<scene.worldObjects.length; i++) {
            this.defaultUniformData[i][0] = time;
            this.defaultUniformData[i][1] = frame;
            this.defaultUniformData[i][2] = scene.worldObjects[i].vertMode;
            this.defaultUniformData[i][3] = scene.worldObjects[i].fragMode;
            this.defaultUniformData[i].subarray(4, 4+4).set(scene.worldObjects[i].color.data);
            this.defaultUniformData[i].subarray(8, 8+16).set(scene.worldObjects[i].model.transpose().data);
            this.defaultUniformData[i].subarray(24, 24+16).set(camera.view.transpose().data);
            this.defaultUniformData[i].subarray(40, 40+16).set(camera.projection.transpose().data);
            this.device.queue.writeBuffer(this.defaultUniformBuffer[i], 0, this.defaultUniformData[i]);

            this.device.queue.writeBuffer(this.vertUniformBuffer[i], 0, scene.worldObjects[i].vertUniforms);
            this.device.queue.writeBuffer(this.fragUniformBuffer[i], 0, scene.worldObjects[i].fragUniforms);
        }

        const encoder = this.device.createCommandEncoder({ label: "render encoder" });
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        for (let i=0; i<scene.worldObjects.length; i++) {
            pass.setPipeline(this.pipeline);
            pass.setVertexBuffer(0, this.vertexBuffer[i]);
            pass.setBindGroup(0, this.defaultUniformBindGroup[i]);
            pass.setBindGroup(1, this.vertUniformBindGroup[i]);
            pass.setBindGroup(2, this.fragUniformBindGroup[i]);
            pass.setBindGroup(3, this.textureBindGroup[i]);
            pass.draw(this.vertexBuffer[i].size / 4 / 12);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);
    }
}