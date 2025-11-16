import { Vec3 } from "./vec";

export class Trigger {
	bbox: [Vec3, Vec3] = [new Vec3(), new Vec3()];
	enabled: boolean = true;
	active: boolean = false;
	onEnter?: Function;
	onLeave?: Function;

	test(pos: Vec3) {
		if (this.isInside(pos)) {
			if (!this.active) {
				this.onEnter?.();
				this.active = true;
			}
		} else {
			if (this.active) {
				this.onLeave?.();
				this.active = false;
			}
		}
	}

	isInside(pos: Vec3): boolean {
		let min = this.bbox[0];
		let max = this.bbox[1];

		return (
			pos.x > min.x && pos.x < max.x &&
			pos.y > min.y && pos.y < max.y &&
			pos.z > min.z && pos.z < max.z
		);
	}
	
}
