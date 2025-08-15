import { Vec2 } from "./vec";

export const Actions = ["left", "right", "up", "down", "forward", "backward", "sprint"] as const;
export type Action = typeof Actions[number];

export class Input {
	private canvas: HTMLCanvasElement;

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

	cursorChange: Vec2 = new Vec2();
	private previousTouch?: Touch;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		addEventListener("keydown", (e) => {
			if ((e.target as HTMLElement).nodeName == "INPUT") {
				return;
			}
			let action = this.controls.get(e.key.toLowerCase());
			if (action) this.activeActions.add(action);
		});
		addEventListener("keyup", (e) => {
			if ((e.target as HTMLElement).nodeName == "INPUT") {
				return;
			}
			let action = this.controls.get(e.key.toLowerCase());
			if (action) this.activeActions.delete(action);
		});
		this.canvas.addEventListener("pointerup", (e) => {
			if (e.pointerType !== "mouse") {
				return;
			}
			if (!document.pointerLockElement) {
				this.canvas.requestPointerLock();
			}
		});
		this.canvas.addEventListener("mousemove", (e) => {
			if (document.pointerLockElement) {
				this.cursorChange = new Vec2(this.cursorChange.x + e.movementX, this.cursorChange.y + e.movementY);
			}
		})
		this.canvas.addEventListener("touchmove", (e) => {
			if (document.pointerLockElement) {
				return;
			}
			if (this.previousTouch) {
				this.cursorChange = new Vec2(e.touches[0].pageX - this.previousTouch.pageX, e.touches[0].pageY - this.previousTouch.pageY);
			}
			this.previousTouch = e.touches[0];
		})
		this.canvas.addEventListener("touchend", (e) => {
			this.previousTouch = undefined;
		});
	}

	resetChange() {
		this.cursorChange = new Vec2();
	}

}