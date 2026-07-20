import { Assets as Assets, MESH_STRIDE, type FragShaderPath, type MeshPath, type TexturePath, type VertShaderPath } from "./assets";
import type { oid } from "./object";
import { GlobalUniforms, ObjectUniforms, PostUniforms, Uniforms } from "./uniforms";
import type { Vec2 } from "./vec";

/** renderer resources, handles low level buffers */
export class Resources {
    private device!: GPUDevice;

    private assets: Assets;

    // resolution dependent textures
    depthFramebuffer!: GPUTexture;
    colorFramebuffer!: GPUTexture;
    posDepthFramebuffer!: GPUTexture;
    normalMaskFramebuffer!: GPUTexture;

    shadowmapFramebuffer!: GPUTexture;
    finalFramebuffer!: GPUTexture;
    portalFramebuffers: GPUTexture[] = [];

    worldRenderPassDescriptor!: GPURenderPassDescriptor;
    postRenderPassDescriptor!: GPURenderPassDescriptor;

    // world resources
    vertexBuffers: Map<MeshPath, GPUBuffer> = new Map(); // mesh asset buffer
    textureBuffers: Map<TexturePath, GPUTexture> = new Map(); // texture asset buffer

    globalUniformBuffer!: GPUBuffer;

    objectInitialized: Map<oid, boolean> = new Map();
    objectPipelines: Map<oid, GPURenderPipeline> = new Map();
    objectBaseUniformBuffers: Map<oid, GPUBuffer> = new Map();
    objectVertUniformBuffers: Map<oid, GPUBuffer> = new Map();
    objectFragUniformBuffers: Map<oid, GPUBuffer> = new Map();
    objectUniformBindgroups: Map<oid, GPUBindGroup> = new Map();
    objectTextureBindgroups: Map<oid, GPUBindGroup> = new Map();

    // post resources
    postTextureBuffers: Map<TexturePath, GPUTexture> = new Map();

    postPipeline!: GPURenderPipeline;
    postBaseUniformBuffer!: GPUBuffer;
    postFragUniformBuffer!: GPUBuffer;
    postUniformBindgroup!: GPUBindGroup;
    postTextureBindgroup!: GPUBindGroup;
    postFramebufferBindgroup!: GPUBindGroup;

    constructor(device: GPUDevice, assets: Assets) {
		this.device = device;
		this.assets = assets;
    }

    recreateFramebuffers(resolution: Vec2, n_portals: number, renderTarget: GPUTexture) {
        this.destroyFramebufferTextures();
        this.createFramebufferTextures(resolution, n_portals);
        this.configureRenderPass(renderTarget);
    }

    // ---- config render targets ----

    createFramebufferTextures(resolution: Vec2, n_portals: number) {
        this.depthFramebuffer = this.device.createTexture({
            label: "depth texture",
            size: [resolution.x, resolution.y],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });

        this.colorFramebuffer = this.device.createTexture({
            label: "color framebuffer",
            size: [resolution.x, resolution.y],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        });
        this.posDepthFramebuffer = this.device.createTexture({
            label: "pos/depth framebuffer",
            size: [resolution.x, resolution.y],
            format: "rgba32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.normalMaskFramebuffer = this.device.createTexture({
            label: "normal/mask framebuffer",
            size: [resolution.x, resolution.y],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.shadowmapFramebuffer = this.device.createTexture({
            label: "shadowmap",
            size: [resolution.x, resolution.y],
            format: 'depth32float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        this.finalFramebuffer = this.device.createTexture({
            label: "prev framebuffer",
            size: [resolution.x, resolution.y],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.portalFramebuffers = new Array(n_portals).fill(0).map((_, i) => {
            return this.device.createTexture({
                label: `portal ${i} framebuffer`,
                size: [resolution.x, resolution.y],
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
        });
    }

    destroyFramebufferTextures() {
        this.depthFramebuffer?.destroy();
        this.colorFramebuffer?.destroy();
        this.posDepthFramebuffer?.destroy();
        this.normalMaskFramebuffer?.destroy();

        this.shadowmapFramebuffer?.destroy();
        this.finalFramebuffer?.destroy();
        this.portalFramebuffers.map(t => t.destroy());
    }

    configureRenderPass(renderTarget: GPUTexture) {
        this.worldRenderPassDescriptor = {
            label: "render pass descriptor",
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.colorFramebuffer.createView()
            }, {
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.posDepthFramebuffer.createView()
            }, {
                clearValue: [0.5, 0.5, 0.5, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.normalMaskFramebuffer.createView()
            }],
            depthStencilAttachment: {
                depthClearValue: 0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                view: this.depthFramebuffer.createView(),
            }
        };

        this.postRenderPassDescriptor = {
            label: "post render pass descriptor",
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: "clear",
                storeOp: "store",
                view: renderTarget.createView()
            }]
        };
    }

    // ---- create and destroy asset-dependent resources ---- 

    createGlobalUniformBuffer() {
        const globalUniformLength = new GlobalUniforms()._size();
        const globalUniformBuffer = this.device.createBuffer({
            label: "global uniform buffer",
            size: globalUniformLength * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.globalUniformBuffer = globalUniformBuffer;
    }

    async createObjectPipeline(vertShader: VertShaderPath, fragShader: FragShaderPath): Promise<GPURenderPipeline> {
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
    async createObjectUniformBuffers(vertUniforms: Uniforms, fragUniforms: Uniforms, pipeline: GPURenderPipeline): Promise<[GPUBuffer, GPUBuffer, GPUBuffer, GPUBindGroup]> {
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

        const uniformBindgroup = this.device.createBindGroup({
            label: `uniform bindgroup: ${vertUniforms._name}/${fragUniforms._name}`,
            layout: pipeline.getBindGroupLayout(0),
            entries: uniformBindings,
        });

        return [objectUniformBuffer, vertUniformBuffer, fragUniformBuffer, uniformBindgroup];
    }

    /** create vertex buffer from mesh asset path and write */
    async createVertexBuffer(mesh: MeshPath): Promise<GPUBuffer> {
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
    async createTextureBuffer(path: TexturePath): Promise<GPUTexture> {
        const textureData = await this.assets.loadTexture(path);
        const textureBuffer = this.device.createTexture({
            label: `texture buffer: ${path}`,
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
    async createTextureBindgroup(textures: GPUTexture[], pipeline: GPURenderPipeline): Promise<GPUBindGroup> {
        const sampler = this.device.createSampler({
            addressModeU: "repeat", 
            addressModeV: "repeat",
            magFilter: "nearest", // for crisp low res textures
            minFilter: "linear", // for less aliasing
            mipmapFilter: "linear",
        });
        const sampler_direct = this.device.createSampler({ // non-filtering sampler
            addressModeU: "clamp-to-edge", 
            addressModeV: "clamp-to-edge",
            magFilter: "nearest",
            minFilter: "nearest",
            mipmapFilter: "nearest",
        });
        let textureEntries = textures.map((t, i) => { return { binding: i+2, resource: t.createView() }});
        const textureBindgroup = this.device.createBindGroup({
            label: `texture bindgroup: ${textures.map(b => b.label).join("/")}`,
            layout: pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: sampler_direct },
                ...textureEntries,
            ],
        });
        return textureBindgroup;
    }

    destroyWorldBuffers() {
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
        this.objectUniformBindgroups = new Map();
        this.objectTextureBindgroups = new Map();
    }

    // ---- post resources ----

    async createPostPipeline(postShader: FragShaderPath, presentationFormat: GPUTextureFormat): Promise<GPURenderPipeline> {
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
                    { format: presentationFormat }
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
    async createPostUniformBuffers(postUniforms: Uniforms, postPipeline: GPURenderPipeline): Promise<[GPUBuffer, GPUBuffer, GPUBindGroup]> {
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

        const postUniformBindgroup = this.device.createBindGroup({
            label: `post uniform bindgroup`,
            layout: postPipeline.getBindGroupLayout(0),
            entries: postUniformBindings,
        });

        return [postBaseUniformBuffer, postUniformBuffer, postUniformBindgroup];
    }

    /** create post fb bindgroup at group 2 */
    createPostFramebufferBindgroup(postPipeline: GPURenderPipeline): GPUBindGroup {
        const postFramebufferBindgroup = this.device.createBindGroup({
            label: `post framebuffer bindgroup`,
            layout: postPipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: this.colorFramebuffer.createView() },
                { binding: 1, resource: this.posDepthFramebuffer.createView() },
                { binding: 2, resource: this.normalMaskFramebuffer.createView() },
            ],
        });
        return postFramebufferBindgroup;
    }

    destroyPostBuffers() {
        this.postTextureBuffers.forEach(b => b.destroy());
        this.postBaseUniformBuffer?.destroy();
        this.postFragUniformBuffer?.destroy();

        this.postTextureBuffers = new Map();
        (this.postPipeline as any) = undefined;
        (this.postBaseUniformBuffer as any) = undefined;
        (this.postFragUniformBuffer as any) = undefined;
        (this.postUniformBindgroup as any) = undefined;
        (this.postFramebufferBindgroup as any) = undefined;
    }
}