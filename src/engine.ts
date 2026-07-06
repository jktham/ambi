import { Renderer } from "./renderer";
import { type CameraMode } from "./player";
import { Input } from "./input";
import { Scene } from "./scene";
import { Gui } from "./gui";
import { Uniforms } from "./uniforms";
import { Assets, type FragShaderPath, type TexturePath } from "./assets";
import { scenes } from "./presets";
import type { Vec2 } from "./vec";
import { Profiler } from "./profiler";
import { Player } from "./player";

export class Engine {
	assets: Assets;
	renderer: Renderer;

	input: Input;
	player: Player;
	scene: Scene;

	gui: Gui;
	profiler: Profiler;

	private deltaHist: number[] = [];
	private scheduledFrameHandle: number = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.assets = new Assets();
		this.renderer = new Renderer(canvas, this.assets);

		this.input = new Input(canvas);
		this.player = new Player();
		this.scene = new Scene();

		this.gui = new Gui(this); // needs some things to be constructed already
		this.profiler = new Profiler();
	}

	async run(scene: string) {
		await this.renderer.init();
		await this.setScene(scene);
	}

	async setScene(name: string) {
		cancelAnimationFrame(this.scheduledFrameHandle);
		this.gui.updateInfo("loading...");

		let scene = scenes.get(name);
		if (scene) {
			this.scene = new scene();
		} else {
			console.error(`no scene called ${name}`);
			this.scene = new Scene();
		}

		this.renderer.postShaderOverride = undefined;
		this.renderer.postFragUniformsOverride = undefined;
		this.renderer.postTexturesOverride = undefined;

		this.player.mode = this.scene.cameraMode;
		this.player.position = this.scene.spawnPos;
		this.player.rotation = this.scene.spawnRot;

		this.gui.updateScene(this.scene.name);
		this.gui.updatePost("scene", this.scene.postShader, this.scene.postUniforms, this.scene.postTextures);
		this.gui.updateCameraMode(this.scene.cameraMode);
		this.gui.updateResolution(this.scene.resolution);

		this.scene.init();
		await this.renderer.loadScene(this.scene);
		await this.player.loadColliders(this.assets, this.scene.entities);

		this.loop();
	}

	async setPost(path: FragShaderPath | "scene", uniforms: Uniforms, textures: TexturePath[]) {
		cancelAnimationFrame(this.scheduledFrameHandle);
		this.gui.updateInfo("loading...");

		if (path == "scene") {
			this.renderer.postShaderOverride = undefined;
			this.renderer.postFragUniformsOverride = undefined;
			this.renderer.postTexturesOverride = textures?.length > 0 ? textures : undefined;
			this.gui.updatePost(path, this.scene.postShader, this.scene.postUniforms, this.renderer.postTexturesOverride ?? this.scene.postTextures);

		} else {
			this.renderer.postShaderOverride = path;
			this.renderer.postFragUniformsOverride = uniforms;
			this.renderer.postTexturesOverride = textures;
			this.gui.updatePost(path, this.scene.postShader, this.renderer.postFragUniformsOverride, this.renderer.postTexturesOverride);
		}
		await this.renderer.loadPost(this.scene);

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
		this.deltaHist.push(deltaTime);
		if (this.deltaHist.length > 60) {
			this.deltaHist.shift();
		}
		let deltaAvg = this.deltaHist.reduce((acc, v) => acc + v, 0) / 60.0;

		this.profiler.start("  updatePlayer");
        this.player.updatePosition(this.input.activeActions, deltaTime);
        this.player.updateRotation(this.input.cursorChange);
        this.input.resetChange();
		this.profiler.stop("  updatePlayer");

		this.profiler.start("  updateScene");
		this.scene.update(time, deltaTime, this.player);
		for (let trigger of this.scene.triggers) {
			if (trigger.enabled) await trigger.test(this.player.position);
		}
		if (this.input.activeActions.has("interact")) {
			this.scene.interact(time, this.player);
			this.input.activeActions.delete("interact"); // only trigger once per press
		}
		this.profiler.stop("  updateScene");

		// update camera matrices
		this.player.updateCamera();
		this.scene.shadowSource?.updateMatrices();

		this.gui.updateInfo(`${(1/deltaAvg).toFixed(2)} fps, ${deltaAvg.toFixed(4)} s, ${this.scene.entities.length}/${this.scene.entities.filter(o => o.visible).length}/${this.scene.entities.filter(o => o.collider && o.collidable).length} obj, ${this.scene.triggers.length}/${this.scene.triggers.filter(t => t.enabled).length} trg`);
		
		this.profiler.stop("update");
		if (frame % 120 == 0) this.profiler.print();
	}

	private draw(time: number, frame: number) {
		this.profiler.start("draw");
		this.renderer.drawScene(this.scene, this.player.camera, time, frame, this.profiler);
		this.profiler.stop("draw");
	}

	private loop() {
		let frameRate = 60;
        let t0 = 0;
		let f = 0;
        const newFrame = async (t: number) => {
			this.scheduledFrameHandle = requestAnimationFrame(newFrame);
            if (t0 == 0) {
                t0 = t;
            }
            const dt = (t - t0) / 1000;
            if (frameRate == 0 || dt >= 1 / frameRate - 0.001) {
            	t0 = t;
				f++;
                await this.update(t / 1000, f, dt);
                this.draw(t / 1000, f);
            }
        }

        this.scheduledFrameHandle = requestAnimationFrame(newFrame);
    }
}