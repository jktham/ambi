import { Renderer } from "./renderer";
import { Camera, type CameraMode } from "./camera";
import { Input } from "./input";
import { Scene } from "./scene";
import { Gui } from "./gui";
import { Uniforms } from "./uniforms";
import { Resources } from "./resources";
import { scenes } from "./data";

export class Engine {
	private resources: Resources;
	private renderer: Renderer;
	private camera: Camera;
	private input: Input;
	private scene: Scene;
	private gui: Gui;
	private deltaHist: number[] = [];
	private scheduledFrameHandle: number = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.resources = new Resources();
		this.renderer = new Renderer(canvas, this.resources);
		this.camera = new Camera(canvas, this.resources);
		this.input = new Input(canvas);
		this.scene = new Scene();
		this.gui = new Gui(this);
	}

	async run(scene: string) {
		await this.renderer.init();
		await this.setScene(scene);
	}

	async setScene(name: string) {
		cancelAnimationFrame(this.scheduledFrameHandle);

		let scene = scenes.get(name);
		if (scene) {
			this.scene = new scene();
		} else {
			console.error(`no scene called ${name}`);
			this.scene = new Scene();
		}

		this.renderer.postShaderOverride = undefined;
		this.renderer.postUniformsOverride = undefined;

		this.camera.mode = this.scene.cameraMode;
		this.camera.position = this.scene.spawnPos;
		this.camera.rotation = this.scene.spawnRot;

		this.gui.setScene(this.scene.name);
		this.gui.setPost("scene", this.scene.postShader, this.scene.postUniforms);
		this.gui.setMode(this.scene.cameraMode);

		this.scene.init();
		await this.renderer.loadScene(this.scene);
		await this.camera.loadColliders(this.scene.objects);
		this.loop();
	}

	async setPost(path: string, uniforms: Uniforms) {
		cancelAnimationFrame(this.scheduledFrameHandle);
		if (path == "scene") {
			this.renderer.postShaderOverride = undefined;
			this.renderer.postUniformsOverride = undefined;
			this.gui.setPost(path, this.scene.postShader, this.scene.postUniforms);
		} else {
			this.renderer.postShaderOverride = path;
			this.renderer.postUniformsOverride = uniforms;
			this.gui.setPost(path, this.scene.postShader, this.renderer.postUniformsOverride);
		}
		await this.renderer.loadPost(this.scene);
		this.loop();
	}

	setMode(mode: CameraMode) {
		this.camera.mode = mode;
		this.gui.setMode(mode);
	}

	private update(time: number, deltaTime: number) {
		this.deltaHist.push(deltaTime);
		if (this.deltaHist.length > 60) {
			this.deltaHist.shift();
		}
		let deltaAvg = this.deltaHist.reduce((acc, v) => acc + v, 0) / 60.0;

        this.camera.updatePosition(this.input.activeActions, deltaTime);
        this.camera.updateRotation(this.input.cursorChange);
        this.input.resetChange();
		this.scene.update(time, deltaTime);
		this.gui.updateInfo(`${(1/deltaAvg).toFixed(2)} fps, ${this.scene.resolution.x}x${this.scene.resolution.y}, ${this.scene.objects.length} (${this.scene.objects.filter(o => o.visible).length}) obj`);
	}

	private draw(time: number, frame: number) {
		this.renderer.drawScene(this.scene, this.camera, time, frame);
	}

	private loop() {
		let frameRate = 60;
        let t0 = 0;
		let f = 0;
        const newFrame = (t: number) => {
            if (t0 == 0) {
                t0 = t;
            }
            const dt = (t - t0) / 1000;
            if (frameRate == 0 || dt >= 1 / frameRate - 0.001) {
            	t0 = t;
				f++;
                this.update(t / 1000, dt);
                this.draw(t / 1000, f);
            }
            this.scheduledFrameHandle = requestAnimationFrame(newFrame);
        }

        this.scheduledFrameHandle = requestAnimationFrame(newFrame);
    }
}