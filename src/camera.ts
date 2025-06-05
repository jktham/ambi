import type { Action } from "./input";
import { Vec3, Mat4 } from "./vec";

export class Camera {
	speed: number = 4.0;
	fov: number = 90.0;
	position: Vec3 = new Vec3();
	rotation: Vec3 = new Vec3();
	front: Vec3 = new Vec3();
	right: Vec3 = new Vec3();
	up: Vec3 = new Vec3();
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
		this.updateView();
	}

	updatePosition(actions: Set<Action>, dt: number) {
        for (let action of actions) {
			const speed = actions.has("sprint") ? this.speed * 4 : this.speed;
			switch (action) {
				case "left":
					this.position = this.position.add(this.right.mul(-speed * dt));
					break;
				case "right":
					this.position = this.position.add(this.right.mul(speed * dt));
					break;
				case "up":
					this.position = this.position.add(this.up.mul(speed * dt));
					break;
				case "down":
					this.position = this.position.add(this.up.mul(-speed * dt));
					break;
				case "forward":
					this.position = this.position.add(this.front.mul(speed * dt));
					break;
				case "backward":
					this.position = this.position.add(this.front.mul(-speed * dt));
					break;
			}
		}
		this.updateView();
	}

	updateRotation(cursorChange: Vec3) {
		this.rotation.x += cursorChange.x / 400.0 * Math.PI;
		this.rotation.y += cursorChange.y / 400.0 * Math.PI;
		this.rotation.y = Math.min(Math.max(this.rotation.y, -Math.PI/2 + 0.01), Math.PI/2 - 0.01);
		this.updateView();
	}

	updateView() {
		this.front = Mat4.rotate(this.rotation.y, this.rotation.x, 0).inverse().transform(new Vec3([0, 0, -1])).normalize();
		this.right = this.front.cross(new Vec3([0, 1, 0])).normalize();
		this.up = this.right.cross(this.front).normalize();

		this.view = Mat4.rotate(this.rotation.y, this.rotation.x, 0).mul(Mat4.translate(this.position.mul(1)).inverse());
	}

}