import { Vec2 } from "./vec";

export const Actions = ["left", "right", "up", "down", "forward", "backward", "sprint"] as const;
export type Action = typeof Actions[number];

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
	public cursorChange: Vec2 = new Vec2();

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
				this.cursorChange = new Vec2(this.cursorChange.x + e.movementX, this.cursorChange.y + e.movementY);
			}
		})
	}

	public resetChange() {
		this.cursorChange = new Vec2();
	}

}