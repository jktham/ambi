import type { Camera } from "./camera";
import type { Profiler } from "./profiler";
import { Assets as Assets, MESH_STRIDE, type FragShaderPath, type MeshPath, type MaterialPath, type ShaderPath, type TexturePath, type MaterialTextureLabel } from "./assets";
import type { Scene } from "./scene";
import type { Object } from "./object";
import { GlobalUniforms, ObjectUniforms, PostUniforms, Uniforms } from "./uniforms";
import { Mat4, Vec2 } from "./vec";
import type { Gui } from "./gui";
import { Resources } from "./resources";

/** renderer, handles drawing and high level scene loading */
export class Renderer {
    private canvas: HTMLCanvasElement;
    private context!: GPUCanvasContext;
    private device!: GPUDevice;
    private presentationFormat!: GPUTextureFormat;
    
    private assets: Assets;
    private profiler: Profiler;
    private resources!: Resources;

    resolution: Vec2 = new Vec2(960, 540);
	postShaderOverride?: FragShaderPath;
	postFragUniformsOverride?: Uniforms;
	postTexturesOverride?: TexturePath[];

    constructor(canvas: HTMLCanvasElement, assets: Assets, profiler: Profiler) {
        canvas.width = this.resolution.x;
        canvas.height = this.resolution.y;

		this.canvas = canvas;
        this.assets = assets;
        this.profiler = profiler;
        // async parts in init() due to navigator.gpu request
    }

    async init() {
        this.device = await this.getGPUDevice();
        this.context = this.getContext();

        this.resources = new Resources(this.device, this.assets);
        this.resources.recreateFramebuffers(this.resolution, this.context.getCurrentTexture());
    }

    // ---- webgpu housekeeping ----

	private async getGPUDevice(): Promise<GPUDevice> {
        try {
            const adapter = await navigator.gpu?.requestAdapter(); // may throw error in firefox
            const device = await adapter?.requestDevice();
            if (!adapter || !device) {
                throw new Error("no webgpu device");
            }
            if (adapter?.info?.isFallbackAdapter) {
                alert("fallback to cpu simulated device, bad performance likely.\ntry chrome://flags/#enable-vulkan");
            }
            return device;

        } catch (e) {
            console.error(e);
            alert("no webgpu support, try chrome.\ncompatible browsers: https://caniuse.com/webgpu");
            throw new Error("no webgpu support");
        }
    }

	private getContext(): GPUCanvasContext {
        const context = this.canvas.getContext("webgpu");
        if (!context) {
            throw new Error("no webgpu context");
        }

        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device: this.device,
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        });
        return context;
    }

    // ---- load scene resources ---- 

    async loadScene(scene: Scene, gui: Gui) {
        this.setResolution(scene.resolution);
        console.log("preloading assets");
        await this.preloadAssets(scene, gui);
        console.log("initializing world");
        await this.loadWorld(scene);
        console.log("initializing post");
        await this.loadPost(scene);
    }

    setResolution(resolution: Vec2) {
        this.resolution = resolution;
        this.canvas.width = resolution.x;
        this.canvas.height = resolution.y;

        this.resources.recreateFramebuffers(this.resolution, this.context.getCurrentTexture());
    }

    private async preloadAssets(scene: Scene, gui: Gui) {
        let shaders = new Set<ShaderPath>();
        let meshes = new Set<MeshPath>();
        let textures = new Set<TexturePath>();
        let colliders = new Set<MeshPath>();
        let bboxes = new Set<MeshPath>();
        let mtls = new Set<MaterialPath>();
        for (let object of scene.objects) {
            shaders.add(object.vertShader);
            shaders.add(object.fragShader);
            meshes.add(object.mesh);
            object.textures.filter(t => !(t.startsWith("@") || t.startsWith("$"))).map(t => textures.add(t));
            if (object.collider) colliders.add(object.collider);
            if (object.bbox?.mesh) bboxes.add(object.bbox.mesh);
            if (object.mtl) mtls.add(object.mtl);
        }
        for (let trigger of scene.triggers) {
            if (trigger.bbox?.mesh) bboxes.add(trigger.bbox.mesh);
        }
        shaders.add("post/quad.vert.wgsl");
        shaders.add(this.postShaderOverride ?? scene.postShader);

        let totalAssets = [...shaders, ...meshes, ...textures, ...colliders, ...bboxes, ...mtls].length;

        let loaded: string[] = [];
        let errors: string[] = [];
        const wrapInfo = async (loader: (path: any) => Promise<any>, path: string) => {
            try {
                await loader.call(this.assets, path); // bind assets as this
                loaded.push(path);
                gui.updateInfo(`${loaded.length}/${totalAssets} loaded: ${path}`);
            } catch (e) {
                console.error(e);
                errors.push((e as Error).message);
            }
        }

        let promises: Promise<any>[] = [];
        promises.push(...[...shaders].map((p) => wrapInfo(this.assets.loadShader, p)));
        promises.push(...[...meshes].map((p) => wrapInfo(this.assets.loadMesh, p)));
        promises.push(...[...textures].map((p) => wrapInfo(this.assets.loadTexture, p)));
        promises.push(...[...colliders].map((p) => wrapInfo(this.assets.loadCollider, p)));
        promises.push(...[...bboxes].map((p) => wrapInfo(this.assets.loadBbox, p)));
        promises.push(...[...mtls].map((p) => wrapInfo(this.assets.loadMaterial, p)));
        await Promise.allSettled(promises);

        if (errors.length > 0) gui.updateInfo(`${errors.length} error${errors.length > 1 ? "s" : ""}: ${errors.join(", ")}`);
    }

    private async loadWorld(scene: Scene) {
        this.resources.destroyWorldBuffers();

        this.resources.createGlobalUniformBuffer();

        for (let obj of scene.objects) {
            if (!obj.visible) {
                continue;
            }
            await this.loadObject(obj);
        }

        for (let trigger of scene.triggers) {
            if (trigger.bbox && trigger.bbox.mesh !== undefined) {
                let bbox = await this.assets.loadBbox(trigger.bbox.mesh);
                trigger.bbox.min = bbox.min;
                trigger.bbox.max = bbox.max;
            }
        }
    }

    private async loadObject(obj: Object) {
        // pipeline
        if (!this.resources.objectPipelines.has(obj.id)) { // turns out we have to make one per object due to layout auto bindgroup constraints
            const pipeline = await this.resources.createObjectPipeline(obj.vertShader, obj.fragShader);
            this.resources.objectPipelines.set(obj.id, pipeline);
        }
        const pipeline = this.resources.objectPipelines.get(obj.id)!;

        // vertex buffer
        if (!this.resources.vertexBuffers.has(obj.mesh)) {
            const vertexBuffer = await this.resources.createVertexBuffer(obj.mesh);
            this.resources.vertexBuffers.set(obj.mesh, vertexBuffer);
        }

        // bbox (this should go somewhere else probably but eh) TODO
        if (obj.bbox && obj.bbox.mesh !== undefined) {
            let bbox = await this.assets.loadBbox(obj.bbox.mesh);
            obj.bbox.min = bbox.min;
            obj.bbox.max = bbox.max;
        }

        // uniforms
        if (!this.resources.objectBaseUniformBuffers.has(obj.id)) {
            const [objectUniformBuffer, vertUniformBuffer, fragUniformBuffer, uniformBindgroup] = await this.resources.createObjectUniformBuffers(obj.vertUniforms, obj.fragUniforms, pipeline);
            this.resources.objectBaseUniformBuffers.set(obj.id, objectUniformBuffer);
            this.resources.objectVertUniformBuffers.set(obj.id, vertUniformBuffer);
            this.resources.objectFragUniformBuffers.set(obj.id, fragUniformBuffer);
            this.resources.objectUniformBindgroups.set(obj.id, uniformBindgroup);
        }

        // resolve material textures (also shouldnt be here lol) TODO
        if (obj.mtl) {
            let mtl_textures = await this.assets.loadMaterial(obj.mtl);
            for (let i=0; i<obj.textures.length; i++) {
                if (obj.textures[i].startsWith("@")) {
                    let label = obj.textures[i] as MaterialTextureLabel;
                    if (!mtl_textures.has(label)) {
                        throw new Error(`label ${label} not defined in material`);
                    }
                    obj.textures[i] = mtl_textures.get(label)!;
                }
            }
        }

        // texture asset buffers
        for (let texture of obj.textures) {
            if (!this.resources.textureBuffers.has(texture)) {
                if (!(texture.startsWith("$") || texture.startsWith("@"))) {
                    const textureBuffer = await this.resources.createTextureBuffer(texture);
                    this.resources.textureBuffers.set(texture, textureBuffer);
                }
            }
        }

        // texture bindgroup
        if (!this.resources.objectTextureBindgroups.has(obj.id)
            || obj.textures.find(p => p.startsWith("$"))) { // recreate bindgroups if using builtins, in case framebuffers were resized
            const textureBuffers = obj.textures.map(texture => {
                switch (texture) {
                    case "$shadowmap": {
                        return this.resources.shadowmapFramebuffer;
                    }
                    case "$framebuffer": {
                        return this.resources.finalFramebuffer;
                    }
                    default: {
                        if (texture.startsWith("@")) {
                            throw new Error(`material texture label ${texture} not resolved`);
                        }
                        if (texture.startsWith("$")) {
                            throw new Error(`builtin texture label ${texture} not available`);
                        }
                        if (!this.resources.textureBuffers.has(texture)) {
                            throw new Error(`texture buffer ${texture} not available`);
                        }
                        return this.resources.textureBuffers.get(texture)!;
                    }
                }
            });
            const textureBindgroup = await this.resources.createTextureBindgroup(textureBuffers, pipeline);
            this.resources.objectTextureBindgroups.set(obj.id, textureBindgroup);
        }

        this.resources.objectInitialized.set(obj.id, true);
    }

    async loadPost(scene: Scene) {
        this.resources.destroyPostBuffers();

        // post pipeline
        this.resources.postPipeline = await this.resources.createPostPipeline(this.postShaderOverride ?? scene.postShader, this.presentationFormat);

        // post uniforms
        [this.resources.postBaseUniformBuffer, this.resources.postFragUniformBuffer, this.resources.postUniformBindgroup] = await this.resources.createPostUniformBuffers(this.postFragUniformsOverride ?? scene.postUniforms, this.resources.postPipeline);

        // framebuffer textures
        this.resources.postFramebufferBindgroup = this.resources.createPostFramebufferBindgroup(this.resources.postPipeline);

        // post textures
        for (let texture of this.postTexturesOverride ?? scene.postTextures) {
            if (!this.resources.postTextureBuffers.has(texture)) {
                const textureBuffer = await this.resources.createTextureBuffer(texture);
                this.resources.postTextureBuffers.set(texture, textureBuffer);
            }
        }
        const textureBuffers = (this.postTexturesOverride ?? scene.postTextures).map(texture => this.resources.postTextureBuffers.get(texture)!);
        const textureBindgroup = await this.resources.createTextureBindgroup(textureBuffers, this.resources.postPipeline);
        this.resources.postTextureBindgroup = textureBindgroup;
    }

    // ---- drawing ----

    async drawScene(scene: Scene, camera: Camera, time: number, frame: number) {
        // initialize new objects
        for (let obj of scene.objects) {
            if (!obj.visible) {
                continue;
            }
            if (!(this.resources.objectInitialized.get(obj.id) ?? false) 
                || obj.textures.find(p => p.startsWith("$"))) { // recreate bindgroups if using builtins, in case framebuffers were resized
                await this.loadObject(obj);
            }
        }

        // update object buffers once
        this.profiler.start("  bufferWorldObject");
        for (let obj of scene.objects) {
            this.updateWorldObjectBuffers(obj);
        }
        this.profiler.stop("  bufferWorldObject");

        if (scene.shadowSource) {
            // draw from shadow source pov
            this.updateWorldGlobalBuffers(scene, scene.shadowSource, time, frame);
            this.drawShadows(scene);

            if (scene.objects.flatMap(obj => obj.textures).includes("$shadowmap")) { // only copy if we intend to use it
                // copy depth buffer to shadow map texture
                const encoder = this.device.createCommandEncoder({ label: "copy depth" });
                encoder.copyTextureToTexture({texture: this.resources.depthFramebuffer}, {texture: this.resources.shadowmapFramebuffer}, {width: this.resources.depthFramebuffer.width, height: this.resources.depthFramebuffer.height})
                this.device.queue.submit([encoder.finish()]);
            }
        }

        this.updateWorldGlobalBuffers(scene, camera, time, frame);
        this.drawWorld(scene);

        this.updatePostBuffers(scene, camera, time, frame);
        this.drawPost();

        if (scene.objects.flatMap(obj => obj.textures).includes("$framebuffer")) { // only copy if we intend to use it
            // copy color buffer to prev framebuffer texture
            const encoder = this.device.createCommandEncoder({ label: "copy framebuffer" });
            encoder.copyTextureToTexture({texture: this.context.getCurrentTexture()}, {texture: this.resources.finalFramebuffer}, {width: this.context.getCurrentTexture().width, height: this.context.getCurrentTexture().height})
            this.device.queue.submit([encoder.finish()]);
        }
    }

    private updateWorldGlobalBuffers(scene: Scene, camera: Camera, time: number, frame: number) {
        this.profiler.start("  bufferWorldGlobal");

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

        const globalUniformBuffer = this.resources.globalUniformBuffer;
        this.device.queue.writeBuffer(globalUniformBuffer, 0, globalUniforms._update().buffer);
        this.profiler.stop("  bufferWorldGlobal");
    }

    private updateWorldObjectBuffers(obj: Object) {
        if (!obj.visible || !obj.changed) {
            return;
        }
        obj.changed = false;
        
        let objectUniforms = new ObjectUniforms();
        objectUniforms.mask = obj.mask;
        objectUniforms.cull = obj.cull;
        objectUniforms.id = obj.id;
        objectUniforms.uv_scale = obj.uv_scale;
        objectUniforms.color = obj.color;
        objectUniforms.vert_config = obj.vertConfig;
        objectUniforms.frag_config = obj.fragConfig;
        objectUniforms.model = obj.model;
        objectUniforms.normal = obj.model.inverse().transpose();

        const objectUniformBuffer = this.resources.objectBaseUniformBuffers.get(obj.id);
        const vertUniformBuffer = this.resources.objectVertUniformBuffers.get(obj.id);
        const fragUniformBuffer = this.resources.objectFragUniformBuffers.get(obj.id);
        if (!objectUniformBuffer || !vertUniformBuffer || !fragUniformBuffer) {
            throw new Error(`missing uniform buffers ${obj.id}`);
        }

        this.device.queue.writeBuffer(objectUniformBuffer, 0, objectUniforms._update().buffer);
        if (obj.vertUniforms._size() > 0) {
            this.device.queue.writeBuffer(vertUniformBuffer, 0, obj.vertUniforms._update().buffer);
        }
        if (obj.fragUniforms._size() > 0) {
            this.device.queue.writeBuffer(fragUniformBuffer, 0, obj.fragUniforms._update().buffer);
        }
    }

    private updatePostBuffers(scene: Scene, camera: Camera, time: number, frame: number) {
        this.profiler.start("  bufferPost");
        let postBaseUniforms = new PostUniforms();
        postBaseUniforms.time = time;
        postBaseUniforms.frame = frame;
        postBaseUniforms.resolution = new Vec2(this.canvas.width, this.canvas.height);
        postBaseUniforms.post_config = scene.postConfig;
        postBaseUniforms.view = camera.view;
        postBaseUniforms.projection = camera.projection;
        this.device.queue.writeBuffer(this.resources.postBaseUniformBuffer, 0, postBaseUniforms._update().buffer);

        let postUniforms = this.postFragUniformsOverride ?? scene.postUniforms;
        if (postUniforms._size() > 0) {
            this.device.queue.writeBuffer(this.resources.postFragUniformBuffer, 0, postUniforms._update().buffer);
        }
        this.profiler.stop("  bufferPost");
    }

    private drawShadows(scene: Scene) {
        this.profiler.start("  drawShadows");
        const encoder = this.device.createCommandEncoder({ label: "world render encoder" });
        const pass = encoder.beginRenderPass(this.resources.worldRenderPassDescriptor);
        for (let object of scene.objects) {
            if (!object.visible || !object.shadows) {
                continue;
            }
            const pipeline = this.resources.objectPipelines.get(object.id);
            const vertexBuffer = this.resources.vertexBuffers.get(object.mesh);
            const uniformBindgroup = this.resources.objectUniformBindgroups.get(object.id);
            const textureBindgroup = this.resources.objectTextureBindgroups.get(object.id);
            if (!pipeline || !vertexBuffer || !uniformBindgroup || !textureBindgroup) {
                throw new Error(`missing object assets ${object.id}, ${object.tags}, ${object.mesh}, ${object.textures}`);
            }

            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setBindGroup(0, uniformBindgroup);
            pass.setBindGroup(1, textureBindgroup);
            pass.draw(vertexBuffer.size / 4 / MESH_STRIDE, object.vertUniforms._instanceCount || 1);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);
        this.profiler.stop("  drawShadows");
    }

    private drawWorld(scene: Scene) {
        this.profiler.start("  drawWorld");
        const encoder = this.device.createCommandEncoder({ label: "world render encoder" });
        const pass = encoder.beginRenderPass(this.resources.worldRenderPassDescriptor);
        for (let object of scene.objects) {
            if (!object.visible) {
                continue;
            }
            const pipeline = this.resources.objectPipelines.get(object.id);
            const vertexBuffer = this.resources.vertexBuffers.get(object.mesh);
            const uniformBindgroup = this.resources.objectUniformBindgroups.get(object.id);
            const textureBindgroup = this.resources.objectTextureBindgroups.get(object.id);
            if (!pipeline || !vertexBuffer || !uniformBindgroup || !textureBindgroup) {
                throw new Error(`missing object assets ${object.id}, ${object.tags}, ${object.mesh}, ${object.textures}`);
            }

            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setBindGroup(0, uniformBindgroup);
            pass.setBindGroup(1, textureBindgroup);
            pass.draw(vertexBuffer.size / 4 / MESH_STRIDE, object.vertUniforms._instanceCount || 1);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);
        this.profiler.stop("  drawWorld");
    }

    private drawPost() {
        this.profiler.start("  drawPost");
        (this.resources.postRenderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.context.getCurrentTexture().createView();
        const postEncoder = this.device.createCommandEncoder({ label: "post render encoder" });
        const postPass = postEncoder.beginRenderPass(this.resources.postRenderPassDescriptor);
        postPass.setPipeline(this.resources.postPipeline);
        postPass.setBindGroup(0, this.resources.postUniformBindgroup);
        postPass.setBindGroup(1, this.resources.postTextureBindgroup);
        postPass.setBindGroup(2, this.resources.postFramebufferBindgroup);
        postPass.draw(6);
        postPass.end();
        this.device.queue.submit([postEncoder.finish()]);
        this.profiler.stop("  drawPost");
    }
}