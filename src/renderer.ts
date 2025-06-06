import { vert, frag } from "./shaders";
import { Camera } from "./camera";
import { Input } from "./input";
import { Mat4 } from "./vec";

export class Renderer {
    private device!: GPUDevice
    private context!: GPUCanvasContext
    private presentationFormat!: GPUTextureFormat
    private vertexShader!: GPUShaderModule
    private fragmentShader!: GPUShaderModule
    private pipeline!: GPURenderPipeline
    private renderPassDescriptor!: GPURenderPassDescriptor
    private vertexBuffer!: GPUBuffer
    private uniformBuffer!: GPUBuffer
    private uniformData!: Float32Array
    private bindGroup!: GPUBindGroup
    public camera!: Camera
    public input!: Input
    private textureBindGroup!: GPUBindGroup;

    constructor(private canvas: HTMLCanvasElement) {
		
    }

    public async init() {
        this.camera = new Camera()
        this.input = new Input()
        await this.getGPUDevice()
        this.configCanvas()
        this.loadShaders()
        this.configurePipeline()
        this.configureVertexBuffer()
        this.configureUniformBuffer()
        this.configureTextureBuffer()
        this.configureRenderPassDescriptor()
        this.loop()
    }

	private async getGPUDevice() {
        var adapter = await navigator.gpu?.requestAdapter()
        const device = await adapter?.requestDevice()
        if (!device) {
            this.fail("Browser does not support WebGPU")
            return
        }

        this.device = device
    }

    private fail(msg: string) {
        document.body.innerHTML = `<H1>${msg}</H1>`
    }

	private configCanvas() {
        var context = this.canvas.getContext("webgpu")
        if (!context) {
            this.fail("Failed to get canvas context")
            return
        }
        this.context = context

        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat()
        context.configure({
            device: this.device,
            format: this.presentationFormat
        })
    }

	private loadShaders() {
        this.loadVertexShader()
        this.loadFragmentShader()
    }

    private loadVertexShader() {
        this.vertexShader = this.device.createShaderModule({
            label: "Vertex Shader",
            code: vert,
        })
    }

    private loadFragmentShader() {
        this.fragmentShader = this.device.createShaderModule({
            label: "Fragment Shader",
            code: frag,
        })
    }

    private configurePipeline() {
        this.pipeline = this.device.createRenderPipeline({
            label: "Render Pipeline",
            layout: "auto",
            vertex: {
                module: this.vertexShader,
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
                module: this.fragmentShader,
                targets: [{ format: this.presentationFormat }]
            }
        })
    }

    private configureVertexBuffer() {
        const vertexData = new Float32Array(9 * 3)
        vertexData.set([
             0.0,  0.8, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            -0.8, -0.8, -1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0,
             0.8, -0.8, -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0,
        ])
        
        this.vertexBuffer = this.device.createBuffer({
            label: "vertex buffer",
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData)
    }

    private configureUniformBuffer() {
        this.uniformBuffer = this.device.createBuffer({
            label: "uniform buffer",
            size: (4 + 16 + 16 + 16) * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this.uniformData = new Float32Array((4 + 16 + 16 + 16))

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer }},
            ],
      });

    }

    private configureTextureBuffer() {
        const textureData = new Uint8Array([
            [255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 255, 255], 
            [255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 255, 255], 
            [255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 255, 255]
        ].flat());
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
        this.textureBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: textureBuffer.createView() },
            ],
        });

    }

    private configureRenderPassDescriptor() {
        this.renderPassDescriptor = {
            label: "Render Pass Description",
            colorAttachments: [{
                clearValue: [0.1, 0.1, 0.1, 1.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.context.getCurrentTexture().createView()
            }]
        }
    }

    private update(dt: number) {
        this.camera.updatePosition(this.input.activeActions, dt);
        this.camera.updateRotation(this.input.cursorChange);
        this.input.resetChange();
    }

    private render() {
        (this.renderPassDescriptor.colorAttachments as any)[0].view = this.context.getCurrentTexture().createView()

        this.uniformData[0] = ((Date.now() - 1748964096000) / 1000)
        const model = Mat4.rotate(0, 0, this.uniformData[0]);
        this.uniformData.subarray(4, 20).set(model.transpose().data)
        this.uniformData.subarray(20, 36).set(this.camera.view.transpose().data)
        this.uniformData.subarray(36, 52).set(this.camera.projection.transpose().data)
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData)

        const encoder = this.device.createCommandEncoder({ label: "render encoder" })
        const pass = encoder.beginRenderPass(this.renderPassDescriptor)
        pass.setPipeline(this.pipeline)
        pass.setVertexBuffer(0, this.vertexBuffer)
        pass.setBindGroup(0, this.bindGroup)
        pass.setBindGroup(1, this.textureBindGroup)
        pass.draw(3)
        pass.end()

        this.device.queue.submit([encoder.finish()])
    }

    private loop() {
        let t0 = 0
        const frame = (t: number) => {
            if (t0 == 0) {
                t0 = t
            }
            const dt = (t - t0) / 1000
            t0 = t;
            if (dt >= 1 / 60) {
                this.update(dt)
                this.render()
            }
            requestAnimationFrame(frame)
        }

        this.render()
        requestAnimationFrame(frame)
    }
}