import type { Action } from "./input";

export class Camera {
	position: number[];
	rotation: number[];
	fov: number;
	view: number[];
	projection: number[];
	speed: number = 4.0;

	constructor() {
		this.position = [0, 0, 1];
		this.rotation = [0, 0];
		this.fov = 90.0;
		this.view = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			-this.position[0], -this.position[1], -this.position[2], 1
		];

		const near = 0.01;
		const far = 1000.0;
		const aspect = 16.0 / 9.0;
		const phi = Math.tan(Math.PI * 0.5 - 0.5 * this.fov / 180.0 * Math.PI);

		this.projection = [
			phi / aspect, 0.0, 0.0, 0.0,
			0.0, phi, 0.0, 0.0,
			0.0, 0.0, far / (near - far), -1.0,
			0.0, 0.0, near * far / (near - far), 0.0,
		];
	}

	updatePosition(actions: Set<Action>, dt: number) {
        for (let action of actions) {
			const speed = actions.has("sprint") ? this.speed * 4 : this.speed;
			switch (action) {
				case "left":
					this.position[0] -= speed * dt;
					break;
				case "right":
					this.position[0] += speed * dt;
					break;
				case "up":
					this.position[1] += speed * dt;
					break;
				case "down":
					this.position[1] -= speed * dt;
					break;
				case "forward":
					this.position[2] -= speed * dt;
					break;
				case "backward":
					this.position[2] += speed * dt;
					break;
			}
		}
		this.view = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			-this.position[0], -this.position[1], -this.position[2], 1
		];
	}

	updateRotation(cursor: [number, number]) {
		this.rotation[0] = cursor[0] / 100.0 * Math.PI;
		this.rotation[1] = cursor[1] / 100.0 * Math.PI;
		this.view = [
			1, 0, 0, 0,
			0, Math.cos(this.rotation[0]), -Math.sin(this.rotation[0]), 0,
			0, Math.sin(this.rotation[0]), Math.cos(this.rotation[0]), 0,
			-this.position[0], -this.position[1], -this.position[2], 1
		];
	}

}