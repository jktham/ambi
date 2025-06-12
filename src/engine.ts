import { Renderer } from "./renderer";
import { Camera } from "./camera";
import { Input } from "./input";
import { Scene } from "./scene";
import { DebugScene } from "./scenes/debugScene";
import { Gui } from "./gui";
import { Debug2Scene } from "./scenes/debug2Scene";

export class Engine {
	private renderer: Renderer;
	private camera: Camera;
	private input: Input;
	private scene: Scene;
	private exitLoop: boolean = false;
	private gui: Gui;

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new Renderer(canvas);
		this.camera = new Camera(canvas);
		this.input = new Input(canvas);
		this.scene = new Scene();
		this.gui = new Gui(this);
	}

	public async run() {
		await this.renderer.init();
		await this.setScene("debug");
		this.loop();
	}

	public async setScene(name: string) {
		this.exitLoop = true;
		if (name == "debug") {
			this.scene = new DebugScene();
		} else if (name == "debug2") {
			this.scene = new Debug2Scene();
		} else {
			this.scene = new Scene();
		}
		this.gui.setScene(this.scene.name);
		this.scene.init();
		await this.renderer.loadScene(this.scene);
		this.loop();
	}

	private update(time: number, deltaTime: number) {
        this.camera.updatePosition(this.input.activeActions, deltaTime);
        this.camera.updateRotation(this.input.cursorChange);
        this.input.resetChange();
		this.scene.update(time, deltaTime);
		this.gui.updateInfo(deltaTime, this.scene.name);
	}

	private draw(time: number, frame: number) {
		this.renderer.drawScene(this.scene, this.camera, time, frame);
	}

	private loop() {
		this.exitLoop = false;
		let frameRate = 60;
        let t0 = 0;
		let f = 0;
        const newFrame = (t: number) => {
			if (this.exitLoop) {
				return;
			}
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
            requestAnimationFrame(newFrame);
        }

        requestAnimationFrame(newFrame);
    }
}