import type { Action } from "./input";
import { Vec2, Vec3, Mat4 } from "./vec";

export class Camera {
	private canvas: HTMLCanvasElement;
	private speed: number = 4.0;
	private fov: number = 90.0;

	private velocity: Vec3 = new Vec3();
	private position: Vec3 = new Vec3();
	private rotation: Vec2 = new Vec2();

	private front: Vec3 = new Vec3();
	private right: Vec3 = new Vec3();
	private up: Vec3 = new Vec3();
	public view: Mat4 = new Mat4();
	public projection: Mat4 = new Mat4();

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		this.updateView();
		this.updateProjection();
	}

	public updatePosition(actions: Set<Action>, deltaTime: number) {
		let velocity = new Vec3();
        for (let action of actions) {
			switch (action) {
				case "left":
					velocity = velocity.add(this.right.mul(-1));
					break;
				case "right":
					velocity = velocity.add(this.right);
					break;
				case "up":
					velocity = velocity.add(this.up);
					break;
				case "down":
					velocity = velocity.add(this.up.mul(-1));
					break;
				case "forward":
					velocity = velocity.add(this.front);
					break;
				case "backward":
					velocity = velocity.add(this.front.mul(-1));
					break;
			}
		}
		
		const speed = actions.has("sprint") ? this.speed * 4 : this.speed;
		if (velocity.length() > 0) {
			this.velocity = velocity.normalize().mul(speed);
			this.position = this.position.add(this.velocity.mul(deltaTime));
		}
		this.updateView();
	}

	public updateRotation(cursorChange: Vec2) {
		this.rotation.x += cursorChange.x / 400.0 * Math.PI;
		this.rotation.y += cursorChange.y / 400.0 * Math.PI;
		this.rotation.y = Math.min(Math.max(this.rotation.y, -Math.PI/2 + 0.01), Math.PI/2 - 0.01);
		this.updateView();
	}

	private updateView() {
		this.front = Mat4.rotate(new Vec3(this.rotation.y, this.rotation.x, 0)).inverse().transform(new Vec3(0, 0, -1)).normalize();
		this.right = this.front.cross(new Vec3(0, 1, 0)).normalize();
		this.up = this.right.cross(this.front).normalize();

		this.view = Mat4.rotate(new Vec3(this.rotation.y, this.rotation.x, 0)).mul(Mat4.translate(this.position.mul(1)).inverse());
	}

	private updateProjection() {
		const near = 0.001;
		const far = 1000.0;
		const aspect = this.canvas.width / this.canvas.height;
		const phi = Math.tan((1.0 - this.fov / 180.0) * Math.PI / 2.0);

		this.projection = new Mat4([
			phi, 0.0, 0.0, 0.0,
			0.0, phi * aspect, 0.0, 0.0,
			0.0, 0.0, far / (near - far), near * far / (near - far),
			0.0, 0.0, -1.0, 0.0
		]);
	}

}