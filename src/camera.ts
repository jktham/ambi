import type { Action } from "./input";
import { Vec3, Mat4 } from "./vec";

export class Camera {
	position: Vec3 = new Vec3();
	rotation: Vec3 = new Vec3();
	speed: number = 4.0;
	fov: number = 90.0;
	view: Mat4 = new Mat4();
	projection: Mat4;

	constructor() {
		const near = 0.001;
		const far = 1000.0;
		const aspect = 16.0 / 9.0;
		const phi = Math.tan(Math.PI * 0.5 - 0.5 * this.fov / 180.0 * Math.PI);

		this.projection = new Mat4([
			phi / aspect, 0.0, 0.0, 0.0,
			0.0, phi, 0.0, 0.0,
			0.0, 0.0, far / (near - far), near * far / (near - far),
			0.0, 0.0, -1.0, 0.0
		]);
	}

	updatePosition(actions: Set<Action>, dt: number) {
        for (let action of actions) {
			const speed = actions.has("sprint") ? this.speed * 4 : this.speed;
			switch (action) {
				case "left":
					this.position.x -= speed * dt;
					break;
				case "right":
					this.position.x += speed * dt;
					break;
				case "up":
					this.position.y += speed * dt;
					break;
				case "down":
					this.position.y -= speed * dt;
					break;
				case "forward":
					this.position.z -= speed * dt;
					break;
				case "backward":
					this.position.z += speed * dt;
					break;
			}
		}
		this.updateView();
	}

	updateRotation(cursor: Vec3) {
		this.rotation.x = cursor.x / 400.0 * Math.PI;
		this.rotation.y = cursor.y / 400.0 * Math.PI;
		this.updateView();
	}

	updateView() {
		this.view = Mat4.rotate(this.rotation.y, this.rotation.x, 0).mul(Mat4.translate(this.position.mul(-1)));
	}

}