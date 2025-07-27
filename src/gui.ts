import { cameraModes, type CameraMode } from "./camera";
import type { Engine } from "./engine";
import { Uniforms } from "./uniforms";

export class Gui {
	private info: HTMLSpanElement = document.getElementById("gui-info")! as HTMLSpanElement;
	private sceneSelect: HTMLSelectElement = document.getElementById("gui-scene-select")! as HTMLSelectElement;
	private postSelect: HTMLSelectElement = document.getElementById("gui-post-select")! as HTMLSelectElement;
	private modeSelect: HTMLSelectElement = document.getElementById("gui-mode-select")! as HTMLSelectElement;
	private keyboardInput: HTMLInputElement = document.getElementById("gui-keyboard-input")! as HTMLInputElement;
	private inputKeyUpHandles: Map<string, number> = new Map();

	constructor(engine: Engine) {
		const scenes = ["none", "debug", "pier", "brutal", "babel"];
		for (let scene of scenes) {
			this.sceneSelect.options.add(new Option(scene));
		}
		this.sceneSelect.addEventListener("change", async (e) => {
			await engine.setScene((e.target as HTMLSelectElement).value);
		});
		this.sceneSelect.addEventListener("keydown", (e) => {
			if (e.key.length == 1 && !e.ctrlKey) {
				e.preventDefault();
			}
		});

		const postShaders: [string, Uniforms][] = [
			["", new Uniforms()], 
			["post/base.frag.wgsl", new Uniforms()], 
			["post/fb_depth.frag.wgsl", new Uniforms()], 
			["post/fb_normal.frag.wgsl", new Uniforms()], 
			["post/fb_pos.frag.wgsl", new Uniforms()], 
			["post/fb_mask.frag.wgsl", new Uniforms()]
		];
		for (let postShader of postShaders) {
			this.postSelect.options.add(new Option(postShader[0]));
		}
		this.postSelect.addEventListener("change", async (e) => {
			let value = (e.target as HTMLSelectElement).value;
			await engine.setPost(value, postShaders.find((s) => s[0] == value)?.[1] || new Uniforms());
		});
		this.postSelect.addEventListener("keydown", (e) => {
			if (e.key.length == 1 && !e.ctrlKey) {
				e.preventDefault();
			}
		});

		for (let mode of cameraModes) {
			this.modeSelect.options.add(new Option(mode));
		}
		this.modeSelect.addEventListener("change", async (e) => {
			let mode = (e.target as HTMLSelectElement).value as CameraMode;
			engine.setMode(mode);
		});
		this.modeSelect.addEventListener("keydown", (e) => {
			if (e.key.length == 1 && !e.ctrlKey) {
				e.preventDefault();
			}
		});

		this.keyboardInput.addEventListener("input", (e) => {
			let key = (e.target as HTMLInputElement).value.toLowerCase();
			let shift = (e.target as HTMLInputElement).value != key;
			(e.target as HTMLInputElement).value = "";

			dispatchEvent(new KeyboardEvent("keydown", {key: key}));

			let handle = this.inputKeyUpHandles.get(key);
			if (handle) {
				clearTimeout(handle);
			}
			this.inputKeyUpHandles.set(key, setTimeout(() => {
				dispatchEvent(new KeyboardEvent("keyup", {key: key}));
			}, 500));

			if (shift) {
				dispatchEvent(new KeyboardEvent("keydown", {key: "shift"}));

				let handle = this.inputKeyUpHandles.get("shift");
				if (handle) {
					clearTimeout(handle);
				}
				this.inputKeyUpHandles.set("shift", setTimeout(() => {
					dispatchEvent(new KeyboardEvent("keyup", {key: "shift"}));
				}, 500));
			}
		});
	}

	updateInfo(text: string) {
		this.info.textContent = text;
	}

	setScene(name: string) {
		this.sceneSelect.value = name;
	}

	setPost(path: string, sceneShader: string) {
		if (path == "") {
			this.postSelect.value = "";
			this.postSelect.options[0].label = `scene (${sceneShader})`;
			return;
		}
		this.postSelect.value = path;
	}

	setMode(mode: CameraMode) {
		this.modeSelect.value = mode;
	}
}
