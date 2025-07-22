import type { Camera } from "./camera";
import { Resources } from "./resources";
import type { Scene, WorldObject } from "./scene";
import { BaseUniforms, InstancedUniforms, PostBaseUniforms, Uniforms } from "./uniforms";
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

    private pipelines: Map<number, GPURenderPipeline> = new Map();
    private vertexBuffers: Map<string, GPUBuffer> = new Map();
    private baseUniformBuffers: Map<number, GPUBuffer> = new Map();
    private vertUniformBuffers: Map<number, GPUBuffer> = new Map();
    private fragUniformBuffers: Map<number, GPUBuffer> = new Map();
    private uniformBindGroups: Map<number, GPUBindGroup> = new Map();
    private textureBuffers: Map<string, GPUTexture> = new Map();
    private textureBindGroups: Map<number, GPUBindGroup> = new Map();

    private postPipeline!: GPURenderPipeline;
    private postBaseUniformBuffer!: GPUBuffer;
    private postUniformBuffer!: GPUBuffer;
    private postUniformBindGroup!: GPUBindGroup;
    private postFrameBufferBindGroup!: GPUBindGroup;

    private resources: Resources;

	public postShaderOverride?: string;
	public postUniformsOverride?: Uniforms;

    constructor(canvas: HTMLCanvasElement, resources: Resources) {
        canvas.width = 960;
        canvas.height = 540;
		this.canvas = canvas;
        this.resources = resources;
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
            if (!adapter || !device) {
                throw new Error("no webgpu device");
            }
            if (adapter?.info?.isFallbackAdapter) {
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
        this.setResolution(scene.resolution);
        await this.preloadResources(scene);
        await this.initWorld(scene);
        await this.initPost(scene);
    }

    public async loadPost(scene: Scene) {
        await this.initPost(scene);
    }

    public setResolution(resolution: Vec2) {
        this.canvas.width = resolution.x;
        this.canvas.height = resolution.y;
        this.destroyFrameBufferTextures();
        this.createFrameBufferTextures();
        this.configureRenderPass();
    }

    private destroyFrameBufferTextures() {
        this.colorFrameBuffer.destroy();
        this.posDepthFrameBuffer.destroy();
        this.normalMaskFrameBuffer.destroy();
    }

    private destroyWorldBuffers() {
        this.vertexBuffers.forEach(b => b.destroy());
        this.baseUniformBuffers.forEach(b => b.destroy());
        this.vertUniformBuffers.forEach(b => b.destroy());
        this.fragUniformBuffers.forEach(b => b.destroy());

        this.pipelines = new Map();
        this.vertexBuffers = new Map();
        this.baseUniformBuffers = new Map();
        this.vertUniformBuffers = new Map();
        this.fragUniformBuffers = new Map();
        this.uniformBindGroups = new Map();
        this.textureBindGroups = new Map();
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

    private async preloadResources(scene: Scene) {
        for (let object of scene.objects) {
            let objectPromises: Promise<any>[] = [];
            objectPromises.push(this.resources.loadShader(object.vertShader));
            objectPromises.push(this.resources.loadShader(object.fragShader));
            objectPromises.push(this.resources.loadMesh(object.mesh));
            objectPromises.push(this.resources.loadTexture(object.texture));
            if (object.collider) objectPromises.push(this.resources.loadMesh(object.collider!));
            await Promise.all(objectPromises);
        }
        let scenePromises: Promise<any>[] = [];
        scenePromises.push(this.resources.loadShader("post/base.vert.wgsl"));
        scenePromises.push(this.resources.loadShader(this.postShaderOverride ?? scene.postShader));
        await Promise.all(scenePromises);
    }

    private async initWorld(scene: Scene) {
        this.destroyWorldBuffers();

        for (let object of scene.objects) {
            this.initObject(object);
        }
    }

    private async initObject(object: WorldObject) {
        // pipeline
        if (!this.pipelines.has(object.id)) { // turns out we have to make one per object due to layout auto bindgroup constraints
            const pipeline = await this.createPipeline(object.vertShader, object.fragShader);
            this.pipelines.set(object.id, pipeline);
        }
        const pipeline = this.pipelines.get(object.id)!;

        // vertex buffer
        if (!this.vertexBuffers.has(object.mesh)) {
            const vertexBuffer = await this.createVertexBuffer(object.mesh);
            this.vertexBuffers.set(object.mesh, vertexBuffer);
        }

        // uniforms
        if (!this.baseUniformBuffers.has(object.id)) {
            const [baseUniformBuffer, vertUniformBuffer, fragUniformBuffer, uniformBindGroup] = await this.createUniformBuffers(object.vertUniforms, object.fragUniforms, pipeline);
            this.baseUniformBuffers.set(object.id, baseUniformBuffer);
            this.vertUniformBuffers.set(object.id, vertUniformBuffer);
            this.fragUniformBuffers.set(object.id, fragUniformBuffer);
            this.uniformBindGroups.set(object.id, uniformBindGroup);
        }

        // textures
        if (!this.textureBuffers.has(object.texture)) {
            const textureBuffer = await this.createTextureBuffer(object.texture, pipeline);
            this.textureBuffers.set(object.texture, textureBuffer);
        }
        if (!this.textureBindGroups.has(object.id)) {
            const textureBuffer = this.textureBuffers.get(object.texture)!;
            const textureBindGroup = await this.createTextureBindGroup(textureBuffer, pipeline);
            this.textureBindGroups.set(object.id, textureBindGroup);
        }
    }

    private async createPipeline(vertShader: string, fragShader: string): Promise<GPURenderPipeline> {
        const vertexShader = this.device.createShaderModule({
            label: "vertex shader",
            code: await this.resources.loadShader(vertShader),
        });
        const fragmentShader = this.device.createShaderModule({
            label: "fragment shader",
            code: await this.resources.loadShader(fragShader),
        });
        const depthStencilState: GPUDepthStencilState = {
            depthWriteEnabled: true,
            depthCompare: 'less' as GPUCompareFunction,
            format: 'depth24plus-stencil8' as GPUTextureFormat,
        };
        const pipeline = this.device.createRenderPipeline({
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
        });
        return pipeline;
    }

    private async createVertexBuffer(mesh: string): Promise<GPUBuffer> {
        const vertexData = await this.resources.loadMesh(mesh);
        const vertexBuffer = this.device.createBuffer({
            label: "vertex buffer",
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(vertexBuffer, 0, vertexData);
        return vertexBuffer;
    }

    private async createUniformBuffers(vertUniforms: Uniforms, fragUniforms: Uniforms, pipeline: GPURenderPipeline): Promise<[GPUBuffer, GPUBuffer, GPUBuffer, GPUBindGroup]> {
        const baseUniformLength = new BaseUniforms().size();
        const baseUniformBuffer = this.device.createBuffer({
            label: "base uniform buffer",
            size: baseUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const vertUniformLength = vertUniforms.size();
        const useStorageBuffer = (vertUniforms as InstancedUniforms).instanceCount > 0;
        const vertUniformBuffer = this.device.createBuffer({
            label: "vert uniform buffer",
            size: vertUniformLength * 4,
            usage: (useStorageBuffer ? GPUBufferUsage.STORAGE : GPUBufferUsage.UNIFORM) | GPUBufferUsage.COPY_DST,
        });
        if (vertUniformLength > 0) {
            this.device.queue.writeBuffer(vertUniformBuffer, 0, vertUniforms.toArray());
        }

        const fragUniformLength = fragUniforms.size();
        const fragUniformBuffer = this.device.createBuffer({
            label: "frag uniform buffer",
            size: fragUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        if (fragUniformLength > 0) {
            this.device.queue.writeBuffer(fragUniformBuffer, 0, fragUniforms.toArray());
        }

        let uniformBindings: GPUBindGroupEntry[] = [];
        uniformBindings.push({ binding: 0, resource: { buffer: baseUniformBuffer }});
        if (vertUniformLength > 0) {
            uniformBindings.push({ binding: 1, resource: { buffer: vertUniformBuffer }});
        }
        if (fragUniformLength > 0) {
            uniformBindings.push({ binding: 2, resource: { buffer: fragUniformBuffer }});
        }

        const uniformBindGroup = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: uniformBindings,
        });

        return [baseUniformBuffer, vertUniformBuffer, fragUniformBuffer, uniformBindGroup];
    }

    private async createTextureBuffer(texture: string, pipeline: GPURenderPipeline): Promise<GPUTexture> {
        const textureData = await this.resources.loadTexture(texture);
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
        return textureBuffer;
    }

    private async createTextureBindGroup(textureBuffer: GPUTexture, pipeline: GPURenderPipeline): Promise<GPUBindGroup> {
        const sampler = this.device.createSampler();
        const textureBindGroup = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: textureBuffer.createView() },
            ],
        });
        return textureBindGroup;
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
            code: await this.resources.loadShader(this.postShaderOverride ?? scene.postShader),
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
        const postBaseUniformLength = new PostBaseUniforms().size();
        this.postBaseUniformBuffer = this.device.createBuffer({
            label: "post base uniform buffer",
            size: postBaseUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        let postUniforms = this.postUniformsOverride ?? scene.postUniforms;
        const postUniformLength = postUniforms.size();
        this.postUniformBuffer = this.device.createBuffer({
            label: "post uniform buffer",
            size: postUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        if (postUniformLength > 0) {
            this.device.queue.writeBuffer(this.postUniformBuffer, 0, postUniforms.toArray());
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
            layout: this.postPipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: this.colorFrameBuffer.createView() },
                { binding: 1, resource: this.posDepthFrameBuffer.createView() },
                { binding: 2, resource: this.normalMaskFrameBuffer.createView() },
            ],
        });
    }

    public async drawScene(scene: Scene, camera: Camera, time: number, frame: number) {
        // initialize new objects
        for (let object of scene.objects) {
            if (!this.baseUniformBuffers.has(object.id)) {
                await this.initObject(object);
            }
        }

        // update world buffers
        for (let object of scene.objects) {
            let baseUniforms = new BaseUniforms();
            baseUniforms.time = time;
            baseUniforms.frame = frame;
            baseUniforms.mask = object.mask;
            baseUniforms.resolution = new Vec2(this.canvas.width, this.canvas.height);
            baseUniforms.color = object.color;
            baseUniforms.viewPos = camera.position;
            baseUniforms.model = object.model;
            baseUniforms.view = camera.view;
            baseUniforms.projection = camera.projection;
            baseUniforms.normal = object.model.inverse().transpose();

            const baseUniformBuffer = this.baseUniformBuffers.get(object.id);
            const vertUniformBuffer = this.vertUniformBuffers.get(object.id);
            const fragUniformBuffer = this.fragUniformBuffers.get(object.id);
            if (!baseUniformBuffer || !vertUniformBuffer || !fragUniformBuffer) {
                console.error(`missing uniform buffers ${object.id}`);
                continue;
            }

            this.device.queue.writeBuffer(baseUniformBuffer, 0, baseUniforms.toArray());
            if (object.vertUniforms.size() > 0) {
                this.device.queue.writeBuffer(vertUniformBuffer, 0, object.vertUniforms.toArray());
            }
            if (object.fragUniforms.size() > 0) {
                this.device.queue.writeBuffer(fragUniformBuffer, 0, object.fragUniforms.toArray());
            }
        }

        // draw world
        const encoder = this.device.createCommandEncoder({ label: "render encoder" });
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        for (let object of scene.objects) {
            const pipeline = this.pipelines.get(object.id);
            const vertexBuffer = this.vertexBuffers.get(object.mesh);
            const uniformBindGroup = this.uniformBindGroups.get(object.id);
            const textureBindGroup = this.textureBindGroups.get(object.id);
            if (!pipeline || !vertexBuffer || !uniformBindGroup || !textureBindGroup) {
                console.error(`missing object resources ${object.id}, ${object.mesh}`);
                continue;
            }

            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setBindGroup(0, uniformBindGroup);
            pass.setBindGroup(1, textureBindGroup);
            pass.draw(vertexBuffer.size / 4 / 12, (object.vertUniforms as InstancedUniforms).instanceCount ?? 1);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);

        // update post buffers
        let postBaseUniforms = new PostBaseUniforms();
        postBaseUniforms.time = time;
        postBaseUniforms.frame = frame;
        postBaseUniforms.resolution = new Vec2(this.canvas.width, this.canvas.height);
        this.device.queue.writeBuffer(this.postBaseUniformBuffer, 0, postBaseUniforms.toArray());

        let postUniforms = this.postUniformsOverride ?? scene.postUniforms;
        if (postUniforms.size() > 0) {
            this.device.queue.writeBuffer(this.postUniformBuffer, 0, postUniforms.toArray());
        }

        // draw post
        (this.postRenderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.context.getCurrentTexture().createView();
        const postEncoder = this.device.createCommandEncoder({ label: "post render encoder" });
        const postPass = postEncoder.beginRenderPass(this.postRenderPassDescriptor);
        postPass.setPipeline(this.postPipeline);
        postPass.setBindGroup(0, this.postUniformBindGroup);
        postPass.setBindGroup(1, this.postFrameBufferBindGroup);
        postPass.draw(6);
        postPass.end();
        this.device.queue.submit([postEncoder.finish()]);
    }
}