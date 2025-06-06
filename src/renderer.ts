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
    private uniformBuffer: GPUBuffer[] = [];
    private uniformData: Float32Array[] = [];
    private uniformBindGroup: GPUBindGroup[] = [];
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
                        arrayStride: 9 * 4,
                        attributes: [
                            {shaderLocation: 0, offset: 0, format: "float32x3"}, // pos
                            {shaderLocation: 1, offset: 3 * 4, format: "float32x4"}, // color
                            {shaderLocation: 2, offset: 7 * 4, format: "float32x2"}, // uv
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
                clearValue: [0.1, 0.1, 0.1, 1.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.context.getCurrentTexture().createView()
            }]
        };
    }

    public async loadScene(scene: Scene) {
        for (let i=0; i<scene.worldObjects.length; i++) {
            // vertex buffer
            const vertexData = await this.resources.loadMesh("triangle.json");
            this.vertexBuffer.push(this.device.createBuffer({
                label: "vertex buffer",
                size: vertexData.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.vertexBuffer[i], 0, vertexData);

            // uniform buffer
            const uniformLength = 4 + 16 + 16 + 16;
            this.uniformData.push(new Float32Array(uniformLength));
            this.uniformBuffer.push(this.device.createBuffer({
                label: "uniform buffer",
                size: uniformLength * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            }));
            this.device.queue.writeBuffer(this.uniformBuffer[i], 0, this.uniformData[i]);
            this.uniformBindGroup.push(this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer[i] }},
                ],
            }));

            // texture buffer
            const textureData = await this.resources.loadTexture("test.json");
            const textureBuffer = this.device.createTexture({
                label: "texture buffer",
                size: [4, 3],
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
            this.device.queue.writeTexture(
                {texture: textureBuffer},
                textureData,
                {bytesPerRow: 4 * 4},
                {width: 4, height: 3}
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

    public drawScene(scene: Scene, camera: Camera) {
        (this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.context.getCurrentTexture().createView();

        for (let i=0; i<scene.worldObjects.length; i++) {
            this.uniformData[i][0] = ((Date.now() - 1748964096000) / 1000);
            this.uniformData[i].subarray(4, 20).set(scene.worldObjects[i].model.transpose().data);
            this.uniformData[i].subarray(20, 36).set(camera.view.transpose().data);
            this.uniformData[i].subarray(36, 52).set(camera.projection.transpose().data);
            this.device.queue.writeBuffer(this.uniformBuffer[i], 0, this.uniformData[i]);
        }

        const encoder = this.device.createCommandEncoder({ label: "render encoder" });
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        for (let i=0; i<scene.worldObjects.length; i++) {
            pass.setPipeline(this.pipeline);
            pass.setVertexBuffer(0, this.vertexBuffer[i]);
            pass.setBindGroup(0, this.uniformBindGroup[i]);
            pass.setBindGroup(1, this.textureBindGroup[i]);
            pass.draw(3);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);
    }
}