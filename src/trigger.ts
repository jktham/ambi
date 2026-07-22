import { Bbox } from "./bbox";
import { Vec3 } from "./vec";

export class Trigger {
	/** trigger area */
	bbox: Bbox = new Bbox();
	enabled: boolean = true;
	active: boolean = false; // true while player in trigger
	onEnter?: Function;
	onLeave?: Function;

	async test(pos: Vec3) {
		if (this.bbox.intersectsPoint(pos)) {
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
