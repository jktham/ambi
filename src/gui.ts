import type { Engine } from "./engine";

export class Gui {
	private info: HTMLSpanElement = document.getElementById("gui-info")! as HTMLSpanElement;
	private sceneSelect: HTMLSelectElement = document.getElementById("gui-scene-select")! as HTMLSelectElement;
	private postSelect: HTMLSelectElement = document.getElementById("gui-post-select")! as HTMLSelectElement;
	private keyboardInput: HTMLInputElement = document.getElementById("gui-keyboard-input")! as HTMLInputElement;
	private inputKeyUpHandles: Map<string, number> = new Map();

	constructor(engine: Engine) {
		const scenes = ["none", "debug", "pier"];
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

		const postShaders = ["post/base.frag.wgsl", "post/ps1_fog.frag.wgsl", "post/fb_depth.frag.wgsl", "post/fb_normal.frag.wgsl", "post/fb_pos.frag.wgsl", "post/fb_mask.frag.wgsl"];
		for (let postShader of postShaders) {
			this.postSelect.options.add(new Option(postShader));
		}
		this.postSelect.addEventListener("change", async (e) => {
			await engine.setPost((e.target as HTMLSelectElement).value);
		});
		this.postSelect.addEventListener("keydown", (e) => {
			if (e.key.length == 1 && !e.ctrlKey) {
				e.preventDefault();
			}
		});

		this.keyboardInput.addEventListener("input", (e) => {
			let key = (e.target as HTMLInputElement).value.toLowerCase();
			(e.target as HTMLInputElement).value = "";

			dispatchEvent(new KeyboardEvent("keydown", {key: key}));

			let handle = this.inputKeyUpHandles.get(key);
			if (handle) {
				clearTimeout(handle);
			}
			this.inputKeyUpHandles.set(key, setTimeout(() => {
				dispatchEvent(new KeyboardEvent("keyup", {key: key}));
			}, 500));
		});
	}

	public updateInfo(deltaTime: number) {
		this.info.textContent = `fps: ${(1/deltaTime).toFixed(2)}`;
	}

	public setScene(name: string) {
		this.sceneSelect.value = name;
	}

	public setPost(path: string) {
		this.postSelect.value = path;
	}
}
