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
	cursor: [number, number] = [0, 0];

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
				this.cursor = [this.cursor[0] + e.movementX, this.cursor[1] + e.movementY];
			}
		})
	}

}