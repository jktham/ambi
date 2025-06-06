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
	private canvas: HTMLCanvasElement;
	public activeActions: Set<Action> = new Set();
	public controls: Map<string, Action> = new Map([
		["w", "forward"],
		["s", "backward"],
		["a", "left"],
		["d", "right"],
		["r", "up"],
		["f", "down"],
		["shift", "sprint"],
	]);
	public cursorChange: Vec3 = new Vec3();

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		addEventListener("keydown", (e) => {
			let action = this.controls.get(e.key.toLowerCase());
			if (action) this.activeActions.add(action);
		});
		addEventListener("keyup", (e) => {
			let action = this.controls.get(e.key.toLowerCase());
			if (action) this.activeActions.delete(action);
		});
		addEventListener("click", (_e) => {
			if (!document.pointerLockElement) {
				this.canvas.requestPointerLock();
			}
		});
		addEventListener("mousemove", (e) => {
			if (document.pointerLockElement) {
				this.cursorChange = new Vec3([this.cursorChange.x + e.movementX, this.cursorChange.y + e.movementY, 0]);
			}
		})
	}

	public resetChange() {
		this.cursorChange = new Vec3();
	}

}