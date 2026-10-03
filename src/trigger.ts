import { Bbox } from "./bbox";
import { Mat4, Vec3 } from "./vec";

export class Trigger {
	enabled: boolean = true;
	active: boolean = false; // true while player in area or alternating after portal enter
	onEnter?: Function;
	onLeave?: Function;

	async test(pos: Vec3) {

	};
}

export class AreaTrigger extends Trigger {
	/** world space transform for bbox */
	model: Mat4 = new Mat4();
	/** trigger area (local space) */
	bbox: Bbox = new Bbox();

	async test(pos: Vec3) {
		if (this.bbox.intersectsPoint(this.model, pos)) {
			if (!this.active) {
				await this.onEnter?.();
				this.active = true;
			}
		} else {
			if (this.active) {
				await this.onLeave?.();
				this.active = false;
			}
		}
	}
}

export class PortalTrigger extends Trigger {
	/** world space transform for quad_v.obj representing portal plane */
	model: Mat4 = new Mat4();
	/** previous relative z to portal */
	prev_z: number | undefined = undefined;

	async test(pos: Vec3) {
		let localPos = this.model.inverse().mulVec(pos);
		let [_translation, rotation, scale] = this.model.decompose();
		let rot = Mat4.rotateIntrinsic(rotation);

		let [e1, e2, e3] = this.model.basis().map(v => rot.inverse().mulVec(v));
		let x = localPos.dot(e1);
		let y = localPos.dot(e2);
		let z = localPos.dot(e3);
		let rel_x = x / scale.x;
		let rel_y = y / scale.y;
		let rel_z = z / scale.z;

		if (!(Math.abs(rel_x) < 1 && Math.abs(rel_y) < 1)) {
			this.prev_z = undefined;
			return;
		}

		if (this.prev_z !== undefined && Math.sign(this.prev_z) != Math.sign(rel_z)) {
			if (!this.active) {
				await this.onEnter?.();
				this.active = true;
				this.prev_z = undefined;
				return;
			} else {
				await this.onLeave?.();
				this.active = false;
				this.prev_z = undefined;
				return;
			}
		}
		
		this.prev_z = rel_z;
	}
}
