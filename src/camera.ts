import type { Collisions } from "./collisions";
import type { Action } from "./input";
import { Vec2, Vec3, Mat4 } from "./vec";

export const cameraModes = ["fly", "walk"] as const;
export type CameraMode = typeof cameraModes[number];

export class Camera {
	private canvas: HTMLCanvasElement;
	private collisions: Collisions;

	speed: number = 4.0;
	fov: number = 100.0;
	mode: CameraMode = "fly";

	velocity: Vec3 = new Vec3();
	position: Vec3 = new Vec3();
	rotation: Vec2 = new Vec2();
	front: Vec3 = new Vec3();
	right: Vec3 = new Vec3();
	up: Vec3 = new Vec3();

	view: Mat4 = new Mat4();
	projection: Mat4 = new Mat4();

	constructor(canvas: HTMLCanvasElement, collisions: Collisions) {
		this.canvas = canvas;
		this.collisions = collisions;

		this.updateView();
		this.updateProjection();
	}

	/** update position based on action input */
	updatePosition(actions: Set<Action>, deltaTime: number) {
		let velocity = new Vec3();
		let front = this.front;
		let right = this.right;
		let up = this.up;

		if (this.mode == "walk") {
			let normal = new Vec3(0, 1, 0);
			front = front.add(normal.mul(-front.dot(normal))).normalize();
			right = right.add(normal.mul(-right.dot(normal))).normalize();
			up = new Vec3();
		}

        for (let action of actions) {
			switch (action) {
				case "left":
					velocity = velocity.add(right.mul(-1));
					break;
				case "right":
					velocity = velocity.add(right);
					break;
				case "up":
					velocity = velocity.add(up);
					break;
				case "down":
					velocity = velocity.add(up.mul(-1));
					break;
				case "forward":
					velocity = velocity.add(front);
					break;
				case "backward":
					velocity = velocity.add(front.mul(-1));
					break;
			}
		}

		const speed = actions.has("sprint") ? this.speed * 4 : this.speed;
		if (velocity.length() > 0) {
			this.velocity = velocity.normalize().mul(speed);
			if (this.mode == "walk") {
				this.position = this.collisions.applyCollisions(this.position, this.velocity.mul(deltaTime), 10);
			} else {
				this.position = this.position.add(this.velocity.mul(deltaTime));
			}
		}
		this.updateView();
	}

	/** update rotation based on cursor input */
	updateRotation(cursorChange: Vec2) {
		this.rotation.x += cursorChange.x / 400.0 * Math.PI;
		this.rotation.y += cursorChange.y / 400.0 * Math.PI;
		this.rotation.y = Math.min(Math.max(this.rotation.y, -Math.PI/2 + 0.01), Math.PI/2 - 0.01);
		this.updateView();
	}

	/** compute view matrix from rotation and position */
	updateView() {
		this.front = Mat4.rotate(new Vec3(this.rotation.y, this.rotation.x, 0)).inverse().transform(new Vec3(0, 0, -1)).normalize();
		this.right = this.front.cross(new Vec3(0, 1, 0)).normalize();
		this.up = this.right.cross(this.front).normalize();

		this.view = Mat4.rotate(new Vec3(this.rotation.y, this.rotation.x, 0)).mul(Mat4.translate(this.position.mul(1)).inverse());
	}

	/** compute projection matrix from fov and canvas aspect ratio */
	updateProjection() {
		const near = 0.001;
		const far = 1000.0;
		const aspect = this.canvas.width / this.canvas.height;
		const phi = Math.tan((1.0 - this.fov / 180.0) * Math.PI / 2.0);

		this.projection = new Mat4([
			phi, 0.0, 0.0, 0.0,
			0.0, phi * aspect, 0.0, 0.0,
			0.0, 0.0, near / (far - near), far * near / (far - near), // reverse z
			0.0, 0.0, -1.0, 0.0
		]);
	}

}