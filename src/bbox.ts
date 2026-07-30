import { Mat4, Vec3 } from "./vec";

/** oriented bounding box */
export class Bbox {
	min: Vec3 = new Vec3(Infinity, Infinity, Infinity);
	max: Vec3 = new Vec3(-Infinity, -Infinity, -Infinity);

	/** defaults to [inf, -inf] (never intersects) */
	constructor(bounds?: [Vec3, Vec3]) {
		if (bounds) {
			if (bounds.length != 2) {
				throw new Error("invalid bbox initializer length");
			}
			this.min = new Vec3(Math.min(bounds[0].x, bounds[1].x), Math.min(bounds[0].y, bounds[1].y), Math.min(bounds[0].z, bounds[1].z));
			this.max = new Vec3(Math.max(bounds[0].x, bounds[1].x), Math.max(bounds[0].y, bounds[1].y), Math.max(bounds[0].z, bounds[1].z));
		}
	}

	/** returns new bbox with increased margins */
	widen(margin: number): Bbox {
		return new Bbox([this.min.sub(margin), this.max.add(margin)]);
	}

	intersectsPoint(model: Mat4, pos: Vec3): boolean {
		pos = model.inverse().mulVec(pos);
		return (
			pos.x >= this.min.x && pos.x <= this.max.x &&
			pos.y >= this.min.y && pos.y <= this.max.y &&
			pos.z >= this.min.z && pos.z <= this.max.z
		);
	}

	// todo: implement model transforms correctly lol
	intersectsBbox(model: Mat4, other_model: Mat4, other_bbox: Bbox): boolean {
		let tf = model.inverse().mul(other_model);
		let min = tf.mulVec(other_bbox.min);
		let max = tf.mulVec(other_bbox.max);
		return (
			max.x >= this.min.x && min.x <= this.max.x &&
			max.y >= this.min.y && min.y <= this.max.y &&
			max.z >= this.min.z && min.z <= this.max.z
		);
	}
	
}
