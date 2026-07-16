import type { Camera } from "./camera";
import type { Profiler } from "./profiler";
import { Assets as Assets, MESH_STRIDE, type FragShaderPath, type MeshPath, type MaterialPath, type ShaderPath, type TexturePath, type VertShaderPath, type TextureMtlLabel } from "./assets";
import type { Scene } from "./scene";
import type { Object, oid } from "./object";
import { GlobalUniforms, ObjectUniforms, PostUniforms, Uniforms } from "./uniforms";
import { Mat4, Vec2 } from "./vec";
import type { Gui } from "./gui";

export class Renderer {
    private canvas: HTMLCanvasElement;
    private device!: GPUDevice;
    private context!: GPUCanvasContext;
    private presentationFormat!: GPUTextureFormat;

    private depthTexture!: GPUTexture;
    private shadowMapTexture!: GPUTexture;
    private colorFrameBuffer!: GPUTexture;
    private posDepthFrameBuffer!: GPUTexture;
    private normalMaskFrameBuffer!: GPUTexture;
    private prevFrameBuffer!: GPUTexture;

    private worldRenderPassDescriptor!: GPURenderPassDescriptor;
    private postRenderPassDescriptor!: GPURenderPassDescriptor;

    private vertexBuffers: Map<MeshPath, GPUBuffer> = new Map(); // mesh asset buffer
    private textureBuffers: Map<TexturePath, GPUTexture> = new Map(); // texture asset buffer

    private objectPipelines: Map<oid, GPURenderPipeline> = new Map();
    private globalUniformBuffer!: GPUBuffer;
    private objectBaseUniformBuffers: Map<oid, GPUBuffer> = new Map();
    private objectVertUniformBuffers: Map<oid, GPUBuffer> = new Map();
    private objectFragUniformBuffers: Map<oid, GPUBuffer> = new Map();
    private objectUniformBindGroups: Map<oid, GPUBindGroup> = new Map();
    private objectTextureBindGroups: Map<oid, GPUBindGroup> = new Map();

    private postPipeline!: GPURenderPipeline;
    private postBaseUniformBuffer!: GPUBuffer;
    private postFragUniformBuffer!: GPUBuffer;
    private postUniformBindGroup!: GPUBindGroup;
    private postTextureBindGroup!: GPUBindGroup;
    private postFrameBufferBindGroup!: GPUBindGroup;

    private assets: Assets;

	postShaderOverride?: FragShaderPath;
	postFragUniformsOverride?: Uniforms;
	postTexturesOverride?: TexturePath[];
    resolution: Vec2 = new Vec2();

    constructor(canvas: HTMLCanvasElement, assets: Assets) {
        canvas.width = 960;
        canvas.height = 540;
		this.canvas = canvas;
        this.assets = assets;
    }

    async init() {
        await this.getGPUDevice();
        this.configureCanvas();
        this.createFrameBufferTextures();
        this.configureRenderPass();
    }

    // ---- webgpu housekeeping ----

	private async getGPUDevice() {
        try {
            var adapter = await navigator.gpu?.requestAdapter(); // may throw error in firefox
            const device = await adapter?.requestDevice();
            if (!adapter || !device) {
                throw new Error("no webgpu device");
            }
            if (adapter?.info?.isFallbackAdapter) {
                alert("fallback to cpu simulated device, bad performance likely.\ntry chrome://flags/#enable-vulkan");
            }
            this.device = device;

        } catch (e) {
            console.error(e);
            alert("no webgpu support, try chrome.\ncompatible browsers: https://caniuse.com/webgpu");
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
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        });
    }

    // ---- config render targets ----

    private configureRenderPass() {
        this.worldRenderPassDescriptor = {
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
                depthClearValue: 0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                view: this.depthTexture.createView(),
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
        this.depthTexture = this.device.createTexture({
            label: "depth texture",
            size: [this.canvas.width, this.canvas.height],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });

        this.colorFrameBuffer = this.device.createTexture({
            label: "color framebuffer",
            size: [this.canvas.width, this.canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        });
        this.posDepthFrameBuffer = this.device.createTexture({
            label: "pos/depth framebuffer",
            size: [this.canvas.width, this.canvas.height],
            format: "rgba32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.normalMaskFrameBuffer = this.device.createTexture({
            label: "normal/mask framebuffer",
            size: [this.canvas.width, this.canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.shadowMapTexture = this.device.createTexture({
            label: "shadowmap",
            size: [this.canvas.width, this.canvas.height],
            format: 'depth32float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        this.prevFrameBuffer = this.device.createTexture({
            label: "color framebuffer",
            size: [this.canvas.width, this.canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
    }

    private destroyFrameBufferTextures() {
        this.depthTexture.destroy();
        this.colorFrameBuffer.destroy();
        this.posDepthFrameBuffer.destroy();
        this.normalMaskFrameBuffer.destroy();

        // TODO: prevent use of destroyed textures
        // this.shadowMapTexture.destroy();
        // this.prevFrameBuffer.destroy();
    }

    // ---- create and destroy asset-dependent resources ---- 

    async loadScene(scene: Scene, gui: Gui) {
        this.setResolution(scene.resolution);
        console.log("preloading assets");
        await this.preloadAssets(scene, gui);
        console.log("initializing world");
        await this.initWorld(scene);
        console.log("initializing post");
        await this.initPost(scene);
    }

    async loadPost(scene: Scene) {
        await this.initPost(scene);
    }

    setResolution(resolution: Vec2) {
        this.resolution = resolution;
        this.canvas.width = resolution.x;
        this.canvas.height = resolution.y;
        this.destroyFrameBufferTextures();
        this.createFrameBufferTextures();
        this.configureRenderPass();
    }

    private destroyWorldBuffers() {
        this.vertexBuffers.forEach(b => b.destroy());
        this.textureBuffers.forEach(b => b.destroy());
        this.objectBaseUniformBuffers.forEach(b => b.destroy());
        this.objectVertUniformBuffers.forEach(b => b.destroy());
        this.objectFragUniformBuffers.forEach(b => b.destroy());

        this.objectPipelines = new Map();
        this.vertexBuffers = new Map();
        this.textureBuffers = new Map();
        (this.globalUniformBuffer as any) = undefined;
        this.objectBaseUniformBuffers = new Map();
        this.objectVertUniformBuffers = new Map();
        this.objectFragUniformBuffers = new Map();
        this.objectUniformBindGroups = new Map();
        this.objectTextureBindGroups = new Map();
    }

    private destroyPostBuffers() {
        this.postBaseUniformBuffer?.destroy();
        this.postFragUniformBuffer?.destroy();

        (this.postPipeline as any) = undefined;
        (this.postBaseUniformBuffer as any) = undefined;
        (this.postFragUniformBuffer as any) = undefined;
        (this.postUniformBindGroup as any) = undefined;
        (this.postFrameBufferBindGroup as any) = undefined;
    }

    private async preloadAssets(scene: Scene, gui: Gui) {
        let shaders = new Set<ShaderPath>();
        let meshes = new Set<MeshPath>();
        let textures = new Set<TexturePath>();
        let mtls = new Set<MaterialPath>();
        for (let object of scene.entities) {
            shaders.add(object.vertShader);
            shaders.add(object.fragShader);
            meshes.add(object.mesh);
            object.textures.filter(t => !(t.startsWith("@") || t.startsWith("$"))).map(t => textures.add(t));
            if (object.collider) meshes.add(object.collider);
            if (object.bbox?.mesh) meshes.add(object.bbox.mesh);
            if (object.mtl) mtls.add(object.mtl);
        }
        for (let trigger of scene.triggers) {
            if (trigger.bbox?.mesh) meshes.add(trigger.bbox.mesh);
        }
        shaders.add("post/quad.vert.wgsl");
        shaders.add(this.postShaderOverride ?? scene.postShader);

        let errors: string[] = [];
        const wrapInfo = async (loader: (path: any) => Promise<any>, path: string) => {
            try {
                await loader.call(this.assets, path); // bind assets as this
                gui.updateInfo(`loaded ${path}`);
            } catch (e) {
                console.error(e);
                errors.push((e as Error).message);
            }
        }

        let promises: Promise<any>[] = [];
        promises.push(...[...shaders].map((p) => wrapInfo(this.assets.loadShader, p)));
        promises.push(...[...meshes].map((p) => wrapInfo(this.assets.loadMesh, p)));
        promises.push(...[...textures].map((p) => wrapInfo(this.assets.loadTexture, p)));
        promises.push(...[...mtls].map((p) => wrapInfo(this.assets.loadMaterial, p)));
        await Promise.allSettled(promises);
        if (errors.length > 0) gui.updateInfo(`failed: ${errors.join(", ")}`);
    }

    private async initWorld(scene: Scene) {
        this.destroyWorldBuffers();

        const globalUniformLength = new GlobalUniforms()._size();
        const globalUniformBuffer = this.device.createBuffer({
            label: "global uniform buffer",
            size: globalUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.globalUniformBuffer = globalUniformBuffer;

        for (let object of scene.entities) {
            if (!object.visible) {
                continue;
            }
            await this.initObject(object);
        }
        for (let trigger of scene.triggers) {
            if (trigger.bbox && trigger.bbox.mesh !== undefined) {
                let bbox = await this.assets.loadBbox(trigger.bbox.mesh);
                trigger.bbox.min = bbox.min;
                trigger.bbox.max = bbox.max;
            }
        }
    }

    private async initObject(object: Object) {
        // pipeline
        if (!this.objectPipelines.has(object.id)) { // turns out we have to make one per object due to layout auto bindgroup constraints
            const pipeline = await this.createObjectPipeline(object.vertShader, object.fragShader);
            this.objectPipelines.set(object.id, pipeline);
        }
        const pipeline = this.objectPipelines.get(object.id)!;

        // vertex buffer
        if (!this.vertexBuffers.has(object.mesh)) {
            const vertexBuffer = await this.createVertexBuffer(object.mesh);
            this.vertexBuffers.set(object.mesh, vertexBuffer);
        }

        // bbox (this should go somewhere else probably but eh)
        if (object.bbox && object.bbox.mesh !== undefined) {
            let bbox = await this.assets.loadBbox(object.bbox.mesh);
            object.bbox.min = bbox.min;
            object.bbox.max = bbox.max;
        }

        // uniforms
        if (!this.objectBaseUniformBuffers.has(object.id)) {
            const [objectUniformBuffer, vertUniformBuffer, fragUniformBuffer, uniformBindGroup] = await this.createObjectUniformBuffers(object.vertUniforms, object.fragUniforms, pipeline);
            this.objectBaseUniformBuffers.set(object.id, objectUniformBuffer);
            this.objectVertUniformBuffers.set(object.id, vertUniformBuffer);
            this.objectFragUniformBuffers.set(object.id, fragUniformBuffer);
            this.objectUniformBindGroups.set(object.id, uniformBindGroup);
        }

        // resolve material textures
        if (object.mtl) {
            let mtl_textures = await this.assets.loadMaterial(object.mtl);
            for (let i=0; i<object.textures.length; i++) {
                if (object.textures[i].startsWith("@")) {
                    let label = object.textures[i] as TextureMtlLabel;
                    if (!mtl_textures.has(label)) {
                        throw new Error(`label ${label} not defined in material`);
                    }
                    object.textures[i] = mtl_textures.get(label)!;
                }
            }
        }

        // load textures
        for (let texture of object.textures) {
            if (!this.textureBuffers.has(texture)) {
                if (!(texture.startsWith("$") || texture.startsWith("@"))) {
                    const textureBuffer = await this.createTextureBuffer(texture);
                    this.textureBuffers.set(texture, textureBuffer);
                } else {
                    switch (texture) {
                        case "$shadowmap": {
                            this.textureBuffers.set(texture, this.shadowMapTexture);
                            break;
                        }
                        case "$framebuffer": {
                            this.textureBuffers.set(texture, this.prevFrameBuffer);
                            break;
                        }
                        default: {
                            throw new Error(`label ${texture} not resolved/valid`);
                        }
                    }
                }
            }
        }
        if (!this.objectTextureBindGroups.has(object.id)) {
            const textureBuffers = object.textures.map(texture => this.textureBuffers.get(texture)!);
            const textureBindGroup = await this.createTextureBindGroup(textureBuffers, pipeline);
            this.objectTextureBindGroups.set(object.id, textureBindGroup);
        }
    }

    private async initPost(scene: Scene) {
        this.destroyPostBuffers();

        // post pipeline
        this.postPipeline = await this.createPostPipeline(this.postShaderOverride ?? scene.postShader);

        // post uniforms
        [this.postBaseUniformBuffer, this.postFragUniformBuffer, this.postUniformBindGroup] = await this.createPostUniformBuffers(this.postFragUniformsOverride ?? scene.postUniforms, this.postPipeline);

        // framebuffer textures
        this.postFrameBufferBindGroup = this.createPostFrameBufferBindGroup(this.postPipeline);

        // post textures
        for (let texture of this.postTexturesOverride ?? scene.postTextures) {
            if (!this.textureBuffers.has(texture)) {
                const textureBuffer = await this.createTextureBuffer(texture);
                this.textureBuffers.set(texture, textureBuffer);
            }
        }
        const textureBuffers = (this.postTexturesOverride ?? scene.postTextures).map(texture => this.textureBuffers.get(texture)!);
        const textureBindGroup = await this.createTextureBindGroup(textureBuffers, this.postPipeline);
        this.postTextureBindGroup = textureBindGroup;
    }

    private async createObjectPipeline(vertShader: VertShaderPath, fragShader: FragShaderPath): Promise<GPURenderPipeline> {
        const vertexShader = this.device.createShaderModule({
            label: `vertex shader: ${vertShader}`,
            code: await this.assets.loadShader(vertShader),
        });
        const fragmentShader = this.device.createShaderModule({
            label: `fragment shader: ${fragShader}`,
            code: await this.assets.loadShader(fragShader),
        });

        const pipeline = this.device.createRenderPipeline({
            label: `world render pipeline: ${vertShader}/${fragShader}`,
            layout: "auto",
            vertex: {
                module: vertexShader,
                buffers: [
                    {
                        arrayStride: MESH_STRIDE * 4,
                        attributes: [
                            {shaderLocation: 0, offset: 0, format: "float32x3"}, // pos
                            {shaderLocation: 1, offset: 3 * 4, format: "float32x3"}, // normal
                            {shaderLocation: 2, offset: 6 * 4, format: "float32x4"}, // color
                            {shaderLocation: 3, offset: 10 * 4, format: "float32x2"}, // uv
                            {shaderLocation: 4, offset: 12 * 4, format: "float32x3"}, // tangent
                        ]
                    }
                ]
            },
            fragment: {
                module: fragmentShader,
                targets: [
                    { // color
                        format: "rgba8unorm",
                        blend: {
                            color: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha'
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha'
                            },
                        },
                    },
                    {  // posDepth
                        format: "rgba32float",
                    },
                    { // normalMask
                        format: "rgba8unorm",
                    },
                ]
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'greater' as GPUCompareFunction,
                format: 'depth32float' as GPUTextureFormat,
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "none"
            }
        });
        return pipeline;
    }

    /** create object uniforms and bindgroup at group 0 */
    private async createObjectUniformBuffers(vertUniforms: Uniforms, fragUniforms: Uniforms, pipeline: GPURenderPipeline): Promise<[GPUBuffer, GPUBuffer, GPUBuffer, GPUBindGroup]> {
        const globalUniformBuffer = this.globalUniformBuffer;

        const objectUniformLength = new ObjectUniforms()._size();
        const objectUniformBuffer = this.device.createBuffer({
            label: `object base uniform buffer: ${vertUniforms._name}/${fragUniforms._name}`,
            size: objectUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const vertUniformLength = vertUniforms._size();
        const vertUniformBuffer = this.device.createBuffer({
            label: `vert uniform buffer: ${vertUniforms._name}`,
            size: vertUniformLength * 4,
            usage: ((vertUniforms._useStorageBuffer === true) ? GPUBufferUsage.STORAGE : GPUBufferUsage.UNIFORM) | GPUBufferUsage.COPY_DST,
        });
        if (vertUniformLength > 0) {
            this.device.queue.writeBuffer(vertUniformBuffer, 0, vertUniforms._update().buffer);
        }

        const fragUniformLength = fragUniforms._size();
        const fragUniformBuffer = this.device.createBuffer({
            label: `frag uniform buffer: ${fragUniforms._name}`,
            size: fragUniformLength * 4,
            usage: ((fragUniforms._useStorageBuffer === true) ? GPUBufferUsage.STORAGE : GPUBufferUsage.UNIFORM) | GPUBufferUsage.COPY_DST,
        });
        if (fragUniformLength > 0) {
            this.device.queue.writeBuffer(fragUniformBuffer, 0, fragUniforms._update().buffer);
        }

        let uniformBindings: GPUBindGroupEntry[] = [];
        uniformBindings.push({ binding: 0, resource: { buffer: globalUniformBuffer }});
        uniformBindings.push({ binding: 1, resource: { buffer: objectUniformBuffer }});
        if (vertUniformLength > 0) {
            uniformBindings.push({ binding: 2, resource: { buffer: vertUniformBuffer }});
        }
        if (fragUniformLength > 0) {
            uniformBindings.push({ binding: 3, resource: { buffer: fragUniformBuffer }});
        }

        const uniformBindGroup = this.device.createBindGroup({
            label: `uniform bindgroup: ${vertUniforms._name}/${fragUniforms._name}`,
            layout: pipeline.getBindGroupLayout(0),
            entries: uniformBindings,
        });

        return [objectUniformBuffer, vertUniformBuffer, fragUniformBuffer, uniformBindGroup];
    }

    /** create vertex buffer from mesh asset path and write */
    private async createVertexBuffer(mesh: MeshPath): Promise<GPUBuffer> {
        const vertexData = await this.assets.loadMesh(mesh);
        const vertexBuffer = this.device.createBuffer({
            label: `vertex buffer: ${mesh}`,
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(vertexBuffer, 0, vertexData.buffer);
        return vertexBuffer;
    }

    /** create texture buffer from texture asset path and write */
    private async createTextureBuffer(texture: TexturePath): Promise<GPUTexture> {
        const textureData = await this.assets.loadTexture(texture);
        const textureBuffer = this.device.createTexture({
            label: `texture buffer: ${texture}`,
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

    /** create texture bindgroup at group 1 from set of texture buffers */
    private async createTextureBindGroup(textureBuffers: GPUTexture[], pipeline: GPURenderPipeline): Promise<GPUBindGroup> {
        const sampler = this.device.createSampler({
            addressModeU: "repeat", 
            addressModeV: "repeat",
            magFilter: "nearest", // for crisp low res textures
            minFilter: "linear", // for less aliasing
        });
        const sampler_direct = this.device.createSampler({ // non-filtering sampler
            addressModeU: "clamp-to-edge", 
            addressModeV: "clamp-to-edge"
        });
        let textureEntries = textureBuffers.map((t, i) => { return { binding: i+2, resource: t.createView() }});
        const textureBindGroup = this.device.createBindGroup({
            label: `texture bindgroup: ${textureBuffers.map(b => b.label).join("/")}`,
            layout: pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: sampler_direct },
                ...textureEntries,
            ],
        });
        return textureBindGroup;
    }

    // ---- post resources ----

    private async createPostPipeline(postShader: FragShaderPath): Promise<GPURenderPipeline> {
        let vertShader: VertShaderPath = "post/quad.vert.wgsl";
        const postVertexShader = this.device.createShaderModule({
            label: `post vertex shader: ${vertShader}`,
            code: await this.assets.loadShader(vertShader),
        });
        const postFragmentShader = this.device.createShaderModule({
            label: `post fragment shader: ${postShader}`,
            code: await this.assets.loadShader(postShader),
        });

        const postPipeline = this.device.createRenderPipeline({
            label: `post pipeline: ${vertShader}/${postShader}`,
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
        return postPipeline;
    }

    /** create post uniforms and bindgroup at group 0 */
    private async createPostUniformBuffers(postUniforms: Uniforms, postPipeline: GPURenderPipeline): Promise<[GPUBuffer, GPUBuffer, GPUBindGroup]> {
        const postBaseUniformLength = new PostUniforms()._size();
        const postBaseUniformBuffer = this.device.createBuffer({
            label: `post base uniform buffer`,
            size: postBaseUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const postUniformLength = postUniforms._size();
        const postUniformBuffer = this.device.createBuffer({
            label: `post uniform buffer`,
            size: postUniformLength * 4,
            usage: ((postUniforms._useStorageBuffer === true) ? GPUBufferUsage.STORAGE : GPUBufferUsage.UNIFORM) | GPUBufferUsage.COPY_DST,
        });
        if (postUniformLength > 0) {
            this.device.queue.writeBuffer(postUniformBuffer, 0, postUniforms._update().buffer);
        }

        let postUniformBindings: GPUBindGroupEntry[] = [];
        postUniformBindings.push({ binding: 0, resource: { buffer: postBaseUniformBuffer }});
        if (postUniformLength > 0) {
            postUniformBindings.push({ binding: 1, resource: { buffer: postUniformBuffer }});
        }

        const postUniformBindGroup = this.device.createBindGroup({
            label: `post uniform bindgroup`,
            layout: postPipeline.getBindGroupLayout(0),
            entries: postUniformBindings,
        });

        return [postBaseUniformBuffer, postUniformBuffer, postUniformBindGroup];
    }

    /** create post fb bindgroup at group 2 */
    private createPostFrameBufferBindGroup(postPipeline: GPURenderPipeline): GPUBindGroup {
        const postFrameBufferBindGroup = this.device.createBindGroup({
            label: `post framebuffer bindgroup`,
            layout: postPipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: this.colorFrameBuffer.createView() },
                { binding: 1, resource: this.posDepthFrameBuffer.createView() },
                { binding: 2, resource: this.normalMaskFrameBuffer.createView() },
            ],
        });
        return postFrameBufferBindGroup;
    }

    // ---- drawing ----

    async drawScene(scene: Scene, camera: Camera, time: number, frame: number, profiler: Profiler) {
        // initialize new objects
        for (let object of scene.entities) {
            if (!object.visible) {
                continue;
            }
            if (!this.objectBaseUniformBuffers.has(object.id)) {
                await this.initObject(object);
            }
        }

        // update object buffers once
        this.updateWorldObjectBuffers(scene, profiler);

        if (scene.shadowSource) {
            // draw from shadow source pov
            this.updateWorldGlobalBuffers(scene, scene.shadowSource, time, frame, profiler);
            this.drawShadows(scene, profiler);

            // copy depth buffer to shadow map texture
            const encoder = this.device.createCommandEncoder({ label: "copy depth" });
            encoder.copyTextureToTexture({texture: this.depthTexture}, {texture: this.shadowMapTexture}, {width: this.depthTexture.width, height: this.depthTexture.height})
            this.device.queue.submit([encoder.finish()]); // todo: prevent destroy while in use
        }

        this.updateWorldGlobalBuffers(scene, camera, time, frame, profiler);
        this.drawWorld(scene, profiler);

        this.updatePostBuffers(scene, camera, time, frame, profiler);
        this.drawPost(profiler);

        if (this.textureBuffers.has("$framebuffer")) { // only copy if we intend to use it
            // copy color buffer to prev framebuffer texture
            const encoder = this.device.createCommandEncoder({ label: "copy framebuffer" });
            encoder.copyTextureToTexture({texture: this.context.getCurrentTexture()}, {texture: this.prevFrameBuffer}, {width: this.context.getCurrentTexture().width, height: this.context.getCurrentTexture().height})
            this.device.queue.submit([encoder.finish()]);
        }
    }

    private updateWorldGlobalBuffers(scene: Scene, camera: Camera, time: number, frame: number, profiler: Profiler) {
        profiler.start("  bufferWorldGlobal");

        // global uniforms, always update
        let globalUniforms = new GlobalUniforms();
        globalUniforms.time = time;
        globalUniforms.frame = frame;
        globalUniforms.fov = camera.fov;
        globalUniforms.resolution = new Vec2(this.canvas.width, this.canvas.height);
        globalUniforms.view_pos = camera.model.origin();
        globalUniforms.view = camera.view;
        globalUniforms.projection = camera.projection;
        globalUniforms.shadow_view = scene.shadowSource?.view ?? new Mat4();
        globalUniforms.shadow_projection = scene.shadowSource?.projection ?? new Mat4();

        const globalUniformBuffer = this.globalUniformBuffer;
        this.device.queue.writeBuffer(globalUniformBuffer, 0, globalUniforms._update().buffer);
        profiler.stop("  bufferWorldGlobal");
    }

    private updateWorldObjectBuffers(scene: Scene, profiler: Profiler) {
        profiler.start("  bufferWorldObject");

        // object uniforms, only update if changed
        for (let object of scene.entities) {
            if (!object.visible || !object.changed) {
                continue;
            }
            object.changed = false;
            
            let objectUniforms = new ObjectUniforms();
            objectUniforms.mask = object.mask;
            objectUniforms.cull = object.cull;
            objectUniforms.id = object.id;
            objectUniforms.uv_scale = object.uv_scale;
            objectUniforms.color = object.color;
            objectUniforms.vert_config = object.vertConfig;
            objectUniforms.frag_config = object.fragConfig;
            objectUniforms.model = object.model;
            objectUniforms.normal = object.model.inverse().transpose();

            const objectUniformBuffer = this.objectBaseUniformBuffers.get(object.id);
            const vertUniformBuffer = this.objectVertUniformBuffers.get(object.id);
            const fragUniformBuffer = this.objectFragUniformBuffers.get(object.id);
            if (!objectUniformBuffer || !vertUniformBuffer || !fragUniformBuffer) {
                console.error(`missing uniform buffers ${object.id}`);
                continue;
            }

            this.device.queue.writeBuffer(objectUniformBuffer, 0, objectUniforms._update().buffer);
            if (object.vertUniforms._size() > 0) {
                this.device.queue.writeBuffer(vertUniformBuffer, 0, object.vertUniforms._update().buffer);
            }
            if (object.fragUniforms._size() > 0) {
                this.device.queue.writeBuffer(fragUniformBuffer, 0, object.fragUniforms._update().buffer);
            }
        }
        profiler.stop("  bufferWorldObject");
    }

    private updatePostBuffers(scene: Scene, camera: Camera, time: number, frame: number, profiler: Profiler) {
        profiler.start("  bufferPost");
        let postBaseUniforms = new PostUniforms();
        postBaseUniforms.time = time;
        postBaseUniforms.frame = frame;
        postBaseUniforms.resolution = new Vec2(this.canvas.width, this.canvas.height);
        postBaseUniforms.post_config = scene.postConfig;
        postBaseUniforms.view = camera.view;
        postBaseUniforms.projection = camera.projection;
        this.device.queue.writeBuffer(this.postBaseUniformBuffer, 0, postBaseUniforms._update().buffer);

        let postUniforms = this.postFragUniformsOverride ?? scene.postUniforms;
        if (postUniforms._size() > 0) {
            this.device.queue.writeBuffer(this.postFragUniformBuffer, 0, postUniforms._update().buffer);
        }
        profiler.stop("  bufferPost");
    }

    private drawShadows(scene: Scene, profiler: Profiler) {
        profiler.start("  drawShadows");
        const encoder = this.device.createCommandEncoder({ label: "world render encoder" });
        const pass = encoder.beginRenderPass(this.worldRenderPassDescriptor);
        for (let object of scene.entities) {
            if (!object.visible || !object.shadows) {
                continue;
            }
            const pipeline = this.objectPipelines.get(object.id);
            const vertexBuffer = this.vertexBuffers.get(object.mesh);
            const uniformBindGroup = this.objectUniformBindGroups.get(object.id);
            const textureBindGroup = this.objectTextureBindGroups.get(object.id);
            if (!pipeline || !vertexBuffer || !uniformBindGroup || !textureBindGroup) {
                console.error(`missing object assets ${object.id}, ${object.tags}, ${object.mesh}, ${object.textures}`);
                continue;
            }

            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setBindGroup(0, uniformBindGroup);
            pass.setBindGroup(1, textureBindGroup);
            pass.draw(vertexBuffer.size / 4 / MESH_STRIDE, object.vertUniforms._instanceCount || 1);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);
        profiler.stop("  drawShadows");
    }

    private drawWorld(scene: Scene, profiler: Profiler) {
        profiler.start("  drawWorld");
        const encoder = this.device.createCommandEncoder({ label: "world render encoder" });
        const pass = encoder.beginRenderPass(this.worldRenderPassDescriptor);
        for (let object of scene.entities) {
            if (!object.visible) {
                continue;
            }
            const pipeline = this.objectPipelines.get(object.id);
            const vertexBuffer = this.vertexBuffers.get(object.mesh);
            const uniformBindGroup = this.objectUniformBindGroups.get(object.id);
            const textureBindGroup = this.objectTextureBindGroups.get(object.id);
            if (!pipeline || !vertexBuffer || !uniformBindGroup || !textureBindGroup) {
                console.error(`missing object assets ${object.id}, ${object.tags}, ${object.mesh}, ${object.textures}`);
                continue;
            }

            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setBindGroup(0, uniformBindGroup);
            pass.setBindGroup(1, textureBindGroup);
            pass.draw(vertexBuffer.size / 4 / MESH_STRIDE, object.vertUniforms._instanceCount || 1);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);
        profiler.stop("  drawWorld");
    }

    private drawPost(profiler: Profiler) {
        profiler.start("  drawPost");
        (this.postRenderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.context.getCurrentTexture().createView();
        const postEncoder = this.device.createCommandEncoder({ label: "post render encoder" });
        const postPass = postEncoder.beginRenderPass(this.postRenderPassDescriptor);
        postPass.setPipeline(this.postPipeline);
        postPass.setBindGroup(0, this.postUniformBindGroup);
        postPass.setBindGroup(1, this.postTextureBindGroup);
        postPass.setBindGroup(2, this.postFrameBufferBindGroup);
        postPass.draw(6);
        postPass.end();
        this.device.queue.submit([postEncoder.finish()]);
        profiler.stop("  drawPost");
    }
}