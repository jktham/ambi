import { Bbox } from "./bbox";
import { Vec3 } from "./vec";

export class Trigger {
	bbox: Bbox = new Bbox();
	enabled: boolean = true;
	active: boolean = false;
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
