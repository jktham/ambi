import { Renderer } from "./renderer";
import { type CameraMode } from "./player";
import { Input } from "./input";
import { Scene } from "./scene";
import { Gui } from "./gui";
import { Uniforms } from "./uniforms";
import { Assets, type MaterialPath, type MeshPath, type ShaderPath, type TexturePath } from "./assets";
import { scenes } from "./presets";
import type { Vec2 } from "./vec";
import { Profiler } from "./profiler";
import { Player } from "./player";
import type { Object } from "./object";

/** main engine class, holds subcomponents and handles update and draw loop */
export class Engine {
	assets: Assets;
	renderer: Renderer;

	input: Input;
	player: Player;
	scene: Scene;

	gui: Gui;
	profiler: Profiler;

	/** framerate limit, 0 to disable */
	framerate = 60;

	private timeOffset: number = 0;
	private deltaHist: number[] = [];
	private deltaAvg: number = 0;
	private mbMem: number = 0;
	private scheduledFrameHandle: number = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.assets = new Assets();
		this.profiler = new Profiler();
		this.input = new Input(canvas);
		this.player = new Player();
		this.scene = new Scene();
		this.renderer = new Renderer(canvas, this.profiler);

		this.gui = new Gui(this); // needs some things to be constructed already
	}

	async run(scene: string) {
		await this.renderer.init();
		await this.setScene(scene);
	}

	async setScene(name: string) {
		cancelAnimationFrame(this.scheduledFrameHandle);
		this.deltaHist = [];
        console.log(`setting scene: ${name}`);
		this.gui.updateInfo(`loading scene: ${name}`);

		if (name != this.scene.name) {
			this.assets.clear();
		}

		let scene = scenes.get(name);
		if (scene) {
			this.scene = new scene();
		} else {
			console.error(`no scene called ${name}`);
			this.scene = new Scene();
		}

		this.renderer.setResolution(this.scene.resolution); // just for black screen during load

        console.log(`preloading assets`);
		await this.preloadAssets(this.scene);

        console.log(`initializing scene`);
		await this.scene.init(this.assets);

		this.renderer.postShaderOverride = undefined;
		this.renderer.postFragUniformsOverride = undefined;
		this.renderer.postTexturesOverride = undefined;

		this.player.mode = this.scene.cameraMode;
		this.player.position = this.scene.spawnPos;
		this.player.rotation = this.scene.spawnRot;
		this.player.loadObjects(this.scene.objects);

		this.gui.updateScene(this.scene.name);
		this.gui.updatePost("scene", this.scene.postShader.path, this.scene.postUniforms, this.scene.postTextures.map(t => t.path));
		this.gui.updateCameraMode(this.scene.cameraMode);
		this.gui.updateResolution(this.scene.resolution);

        console.log(`loading scene`);
		await this.renderer.loadScene(this.scene, this.gui);

		this.timeOffset = performance.now() / 1000; // start time at 0 after done loading scene

        console.log(`done`);
		this.loop();
	}

	async setPost(shaderPath: ShaderPath | "scene", uniforms: Uniforms, texturePaths: TexturePath[]) {
		cancelAnimationFrame(this.scheduledFrameHandle);
		this.deltaHist = [];
		console.log(`loading post: ${shaderPath}`);
		this.gui.updateInfo(`loading post: ${shaderPath}`);

		let textures = await Promise.all(texturePaths.map(async path => await this.assets.loadTexture(path)));

		if (shaderPath == "scene") { // use scene default
			this.renderer.postShaderOverride = undefined;
			this.renderer.postFragUniformsOverride = undefined;
			this.renderer.postTexturesOverride = textures.length > 0 ? textures : undefined;
			this.gui.updatePost(shaderPath, this.scene.postShader.path, this.scene.postUniforms, (this.renderer.postTexturesOverride ?? this.scene.postTextures).map(t => t.path));

		} else {
			this.renderer.postShaderOverride = await this.assets.loadShader(shaderPath);
			this.renderer.postFragUniformsOverride = uniforms;
			this.renderer.postTexturesOverride = textures;
			this.gui.updatePost(shaderPath, this.scene.postShader.path, this.renderer.postFragUniformsOverride, this.renderer.postTexturesOverride.map(t => t.path));
		}
		await this.renderer.loadPost(this.scene);

        console.log(`done`);
		this.loop();
	}

	setCameraMode(cameraMode: CameraMode) {
		this.player.mode = cameraMode;
		this.gui.updateCameraMode(cameraMode);
	}

	async setResolution(resolution: Vec2) {
		this.renderer.setResolution(resolution);
		await this.renderer.loadPost(this.scene);
		this.gui.updateResolution(resolution);
	}

	private async update(time: number, frame: number, deltaTime: number) {
		this.profiler.start("update");

		// ---- player ----
		this.profiler.start("  updatePlayer");
        this.player.updatePosition(this.input.activeActions, deltaTime);
        this.player.updateRotation(this.input.cursorChange);
        this.input.resetChange();
		this.player.updateCamera();
		this.profiler.stop("  updatePlayer");


		// ---- scene ----
		this.profiler.start("  updateScene");

		await this.scene.update(time, deltaTime, this.player, this.assets);
		this.player.updateCamera(); // in case position changed by update

		for (let trigger of this.scene.triggers) {
			if (trigger.enabled) await trigger.test(this.player.position);
		}

		if (this.input.activeActions.has("interact")) {
			await this.scene.interact(time, this.player, this.assets);
			this.input.activeActions.delete("interact"); // only trigger once per press
		}

		for (let obj of this.scene.objects.filter(obj => obj.lifetime !== undefined)) {
			obj.lifetime! -= deltaTime;
		}
		this.scene.objects.splice(0, this.scene.objects.length,...this.scene.objects.filter(obj => obj.lifetime === undefined || obj.lifetime > 0.0))

        // z-sort objects
		let dist = (obj: Object) => obj.model.translation().dist(this.player.camera.model.translation())
        this.scene.objects.filter(obj => obj.z_sort).sort((a, b) => dist(a) - dist(b)).map((obj, i, arr) => {
            let z_frac = (i+1) / (arr.length+1); // (0, 1)
            obj.z = Math.floor(obj.z) + z_frac;
		})
        this.scene.objects.sort((a, b) => b.z - a.z);

		this.profiler.stop("  updateScene");


		// ---- gui ----
		if (frame % 60 == 0) this.mbMem = this.renderer.resources.computeMemoryUsage();
		this.gui.updateInfo(`\
			${(1/this.deltaAvg).toFixed(2)} fps, ${(this.deltaAvg * 1000.0).toFixed(2)} ms, ${this.mbMem.toFixed(2)} mb,\n\
			${this.scene.objects.length}t/${this.scene.objects.filter(o => o.visible).length}v/${this.scene.objects.filter(o => o.collider && o.collidable).length}c obj, \
			${this.scene.triggers.length}t/${this.scene.triggers.filter(t => t.enabled).length}e trg,\
			${this.assets.size()} ast\
		`);
		
		this.profiler.stop("update");
		if (frame % 120 == 0) this.profiler.print();
	}

	private async draw(time: number, frame: number) {
		this.profiler.start("draw");
		await this.renderer.drawScene(this.scene, this.player.camera, time, frame);
		this.profiler.stop("draw");
	}

	private loop() {
        let t0 = 0;
		let f = 0;
        const newFrame = async (t: number) => {
			this.scheduledFrameHandle = requestAnimationFrame(newFrame);
            if (t0 == 0) {
                t0 = t;
            }
            const dt = (t - t0) / 1000;
            if (this.framerate == 0 || dt >= 1 / this.framerate - 0.001) {
            	t0 = t;
				f++;

				this.deltaHist.push(dt);
				if (this.deltaHist.length > 60) {
					this.deltaHist.shift();
				}
				this.deltaAvg = this.deltaHist.reduce((acc, v) => acc + v, 0) / this.deltaHist.length;

                await this.update(t / 1000 - this.timeOffset, f, dt);
                await this.draw(t / 1000 - this.timeOffset, f);
            }
        }

        this.scheduledFrameHandle = requestAnimationFrame(newFrame);
    }

	/** request and cache all needed assets in parallel, updates gui with progress */
	private async preloadAssets(scene: Scene) {
		let shaders = new Set<ShaderPath>();
		let meshes = new Set<MeshPath>();
		let textures = new Set<TexturePath>();
		let colliders = new Set<MeshPath>();
		let bboxes = new Set<MeshPath>();
		let materials = new Set<MaterialPath>();

		scene.preload.shaders?.filter(p => !p.startsWith(":")).map(p => shaders.add(p));
		scene.preload.meshes?.filter(p => !p.startsWith(":")).map(p => meshes.add(p));
		scene.preload.textures?.filter(p => !p.startsWith(":")).map(p => textures.add(p));
		scene.preload.colliders?.filter(p => !p.startsWith(":")).map(p => colliders.add(p));
		scene.preload.bboxes?.filter(p => !p.startsWith(":")).map(p => bboxes.add(p));
		scene.preload.materials?.filter(p => !p.startsWith(":")).map(p => materials.add(p));

		shaders.add("post/quad.vert.wgsl");
		shaders.add(scene.postShader.path);

		let totalAssets = [...shaders, ...meshes, ...textures, ...colliders, ...bboxes, ...materials].length;

		let loaded: string[] = [];
		let errors: string[] = [];
		const wrapInfo = async (loader: (path: any) => Promise<any>, path: string) => {
			try {
				await loader.call(this.assets, path); // bind assets as this
				loaded.push(path);
				this.gui.updateInfo(`${loaded.length}/${totalAssets} loaded: ${path}`);
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
		promises.push(...[...materials].map((p) => wrapInfo(this.assets.loadMaterial, p)));
		await Promise.allSettled(promises);

		if (errors.length > 0) this.gui.updateInfo(`${errors.length} error${errors.length > 1 ? "s" : ""}: ${errors.join(", ")}`);
	}
}