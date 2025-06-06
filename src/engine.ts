import { Renderer } from "./renderer";
import { Camera } from "./camera";
import { Input } from "./input";
import { Scene } from "./scene";

export class Engine {
	private renderer: Renderer;
	private camera: Camera;
	private input: Input;
	private scene: Scene;

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new Renderer(canvas);
		this.camera = new Camera(canvas);
		this.input = new Input(canvas);
		this.scene = new Scene();
	}

	public async run() {
		await this.renderer.init();
		this.scene.init();
		await this.renderer.loadScene(this.scene);
		this.loop();
	}

	private update(dt: number) {
        this.camera.updatePosition(this.input.activeActions, dt);
        this.camera.updateRotation(this.input.cursorChange);
        this.input.resetChange();
		this.scene.update(dt);
	}

	private draw() {
		this.renderer.drawScene(this.scene, this.camera);
	}

	private loop() {
        let t0 = 0;
        const frame = (t: number) => {
            if (t0 == 0) {
                t0 = t;
            }
            const dt = (t - t0) / 1000;
            t0 = t;
            if (dt >= 1 / 60 - 0.001) {
                this.update(dt);
                this.draw();
            }
            requestAnimationFrame(frame);
        }

        this.draw();
        requestAnimationFrame(frame);
    }
}