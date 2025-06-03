import { vert, frag } from "./shaders";

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

    constructor(private canvas: HTMLCanvasElement) {
		
    }

    public async init() {
        await this.getGPUDevice()
        this.configCanvas()
        this.loadShaders()
        this.configurePipeline()
        this.configureVertexBuffer()
        this.configureUniformBuffer()
        this.configureRenderPassDescriptor()
        this.render()
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
                        arrayStride: 6 * 4,
                        attributes: [
                            {shaderLocation: 0, offset: 0, format: "float32x2"}, // pos
                            {shaderLocation: 1, offset: 2 * 4, format: "float32x4"}, // color
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
        const vertexData = new Float32Array(6 * 3)
        vertexData.set([
             0.0,  0.8, 1.0, 0.0, 0.0, 1.0,
            -0.8, -0.8, 0.0, 1.0, 0.0, 1.0,
             0.8, -0.8, 0.0, 0.0, 1.0, 1.0,
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
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this.uniformData = new Float32Array(1)
        this.uniformData[0] = 0.0

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer }},
            ],
      });

    }

    private configureRenderPassDescriptor() {
        this.renderPassDescriptor = {
            label: "Render Pass Description",
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.context.getCurrentTexture().createView()
            }]
        }
    }

    private render() {
        (this.renderPassDescriptor.colorAttachments as any)[0].view = this.context.getCurrentTexture().createView()

        this.uniformData[0] = ((Date.now() - 1748964096000) / 1000)
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData)

        const encoder = this.device.createCommandEncoder({ label: "render encoder" })
        const pass = encoder.beginRenderPass(this.renderPassDescriptor)
        pass.setPipeline(this.pipeline)
        pass.setVertexBuffer(0, this.vertexBuffer)
        pass.setBindGroup(0, this.bindGroup)
        pass.draw(3)
        pass.end()

        this.device.queue.submit([encoder.finish()])
    }
}