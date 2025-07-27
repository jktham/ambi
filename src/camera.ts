import type { Action } from "./input";
import type { Resources } from "./resources";
import type { WorldObject } from "./scene";
import { Vec2, Vec3, Mat4 } from "./vec";

export const cameraModes = ["fly", "walk"] as const;
export type CameraMode = typeof cameraModes[number];

type Collision = {
	position: Vec3,
	velocity: Vec3,
	intersect: Vec3,
	dist: number,
	normal: Vec3,
};

export class Camera {
	private canvas: HTMLCanvasElement;
	private resources: Resources;

	speed: number = 4.0;
	fov: number = 90.0;
	mode: CameraMode = "fly";

	velocity: Vec3 = new Vec3();
	position: Vec3 = new Vec3();
	rotation: Vec2 = new Vec2();
	private front: Vec3 = new Vec3();
	private right: Vec3 = new Vec3();
	private up: Vec3 = new Vec3();

	view: Mat4 = new Mat4();
	projection: Mat4 = new Mat4();

	private objects: WorldObject[] = [];
	private colliders: Map<string, Vec3[][]> = new Map();

	constructor(canvas: HTMLCanvasElement, resources: Resources) {
		this.canvas = canvas;
		this.resources = resources;

		this.updateView();
		this.updateProjection();
	}

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
				this.position = this.applyCollisions(this.position, this.velocity.mul(deltaTime), 10);
			} else {
				this.position = this.position.add(this.velocity.mul(deltaTime));
			}
		}
		this.updateView();
	}

	updateRotation(cursorChange: Vec2) {
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

	async loadColliders(objects: WorldObject[]) {
		this.objects = objects;
		for (let object of this.objects) {
			if (object.collider && !this.colliders.has(object.collider)) {
				const collider = await this.resources.loadCollider(object.collider);
				this.colliders.set(object.collider, collider);
			}
		}
	}

	private applyCollisions(position: Vec3, velocity: Vec3, iterations: number): Vec3 {
		let collisions = this.getCollisions(position, velocity);
		collisions.sort((a, b) => a.dist - b.dist);

		for (let c of collisions) {
			if (velocity.dot(c.normal) > 0) {
				c.normal = c.normal.mul(-1);
			}
			position = position.add(velocity.normalize().mul(c.dist));
			position = position.add(c.normal.mul(0.01));
			let remainder = velocity.normalize().mul(Math.max(0.0, velocity.length()-c.dist));
			let reflected = remainder.sub(c.normal.mul(remainder.dot(c.normal)));

			if (reflected.length() > 0.0 && iterations > 0) {
				return this.applyCollisions(position, reflected, iterations-1);
			}

			return position;
		}

		return position.add(velocity);
	}

	private getCollisions(position: Vec3, velocity: Vec3): Collision[] {
		let collisions: Collision[] = [];

		for (let object of this.objects) {
			if (object.collider) {
				if (object.bbox) {
					let min = object.bbox[0];
					let max = object.bbox[1];
					let posMin = position.sub(velocity.length()*2);
					let posMax = position.add(velocity.length()*2);
					if (
						posMax.x < min.x || posMin.x > max.x || 
						posMax.y < min.y || posMin.y > max.y || 
						posMax.z < min.z || posMin.z > max.z
					) {
						continue;
					}
				}

				let collider = this.colliders.get(object.collider);
				if (collider) {
					let transformed = collider.map(face => face.map(vert => object.model.transform(vert)));
					
					for (let face of transformed) {
						let [v0, v1, v2] = face;
						let u = v1.sub(v0);
						let v = v2.sub(v0);
						let normal = u.cross(v).normalize();

						let dist = v0.sub(position).dot(normal) / velocity.normalize().dot(normal);
						if (isNaN(dist)) dist = -1;
						let intersect = position.add(velocity.normalize().mul(dist));

						if (dist >= 0.0 && dist <= velocity.length()) {
							let signs = [0, 0, 0];
							for (let i=0; i<3; i++) {
								let p = intersect.sub(face[i]);
								let u = face[(i+1) % 3].sub(face[i]);
								let v = face[(i+2) % 3].sub(face[i]);
								let s = p.cross(u).dot(p.cross(v));
								signs[i] = s;
							}
							if (signs.every(s => s < 0)) {
								let c: Collision = {
									position: position,
									velocity: velocity,
									intersect: intersect,
									dist: dist,
									normal: normal,
								};
								collisions.push(c);
							}
						}
					}
				}
			}
		}

		return collisions;
	}

}