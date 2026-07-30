import { Bbox } from "./bbox";
import { Mat4, Vec3 } from "./vec";

export class Trigger {
	/** world space transform for bbox */
	model: Mat4 = new Mat4();
	/** trigger area (local space) */
	bbox: Bbox = new Bbox();
	enabled: boolean = true;
	active: boolean = false; // true while player in trigger
	onEnter?: Function;
	onLeave?: Function;

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
