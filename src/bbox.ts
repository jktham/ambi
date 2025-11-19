import { Mat4, Vec3 } from "./vec";

export class Bbox {
	min: Vec3 = new Vec3(Infinity, Infinity, Infinity);
	max: Vec3 = new Vec3(-Infinity, -Infinity, -Infinity);
	model: Mat4 = new Mat4();
	mesh?: string;

	constructor(bounds?: [Vec3, Vec3]) {
		if (bounds && bounds[0] && bounds[1]) {
			this.min = new Vec3(Math.min(bounds[0].x, bounds[1].x), Math.min(bounds[0].y, bounds[1].y), Math.min(bounds[0].z, bounds[1].z));
			this.max = new Vec3(Math.max(bounds[0].x, bounds[1].x), Math.max(bounds[0].y, bounds[1].y), Math.max(bounds[0].z, bounds[1].z));
		}
	}

	intersectsPoint(pos: Vec3): boolean {
		pos = this.model.inverse().transform(pos);
		return (
			pos.x >= this.min.x && pos.x <= this.max.x &&
			pos.y >= this.min.y && pos.y <= this.max.y &&
			pos.z >= this.min.z && pos.z <= this.max.z
		);
	}

	// todo: implement model transforms correctly lol
	intersectsBbox(bbox: Bbox): boolean {
		let tf = this.model.inverse().mul(bbox.model);
		let min = tf.transform(bbox.min);
		let max = tf.transform(bbox.max);
		return (
			max.x >= this.min.x && min.x <= this.max.x &&
			max.y >= this.min.y && min.y <= this.max.y &&
			max.z >= this.min.z && min.z <= this.max.z
		);
	}
	
}
