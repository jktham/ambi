import { Vec3 } from "./vec";

export type Action = 
	"left" |
	"right" |
	"up" |
	"down" |
	"forward" |
	"backward" |
	"sprint" 
;

export class Input {
	activeActions: Set<Action> = new Set();
	controls: Map<string, Action> = new Map([
		["w", "forward"],
		["s", "backward"],
		["a", "left"],
		["d", "right"],
		["r", "up"],
		["f", "down"],
		["shift", "sprint"],
	]);
	cursorChange: Vec3 = new Vec3();

	constructor() {
		addEventListener("keydown", (e) => {
			let action = this.controls.get(e.key.toLowerCase());
			if (action) this.activeActions.add(action);
		});
		addEventListener("keyup", (e) => {
			let action = this.controls.get(e.key.toLowerCase());
			if (action) this.activeActions.delete(action);
		});
		addEventListener("click", (_e) => {
			const canvas = document.getElementById("canvas")!;
			if (!document.pointerLockElement) {
				canvas.requestPointerLock();
			}
		});
		addEventListener("mousemove", (e) => {
			if (document.pointerLockElement) {
				this.cursorChange = new Vec3([this.cursorChange.x + e.movementX, this.cursorChange.y + e.movementY, 0]);
			}
		})
	}

	resetChange() {
		this.cursorChange = new Vec3();
	}

}