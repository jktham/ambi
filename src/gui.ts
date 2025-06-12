import type { Engine } from "./engine";

export class Gui {
	private info: HTMLSpanElement = document.getElementById("gui-info")! as HTMLSpanElement;
	private sceneSelect: HTMLSelectElement = document.getElementById("gui-scene-select")! as HTMLSelectElement;
	private postSelect: HTMLSelectElement = document.getElementById("gui-post-select")! as HTMLSelectElement;

	constructor(engine: Engine) {
		const scenes = ["none", "debug", "debug2"];
		for (let scene of scenes) {
			this.sceneSelect.options.add(new Option(scene));
		}
		this.sceneSelect.addEventListener("change", async (e) => {
			await engine.setScene((e.target as HTMLSelectElement).value);
		})

		const postShaders = ["post/base.frag.wgsl", "post/fb_depth.frag.wgsl", "post/fb_normal.frag.wgsl", "post/fb_pos.frag.wgsl", "post/fb_mask.frag.wgsl"];
		for (let postShader of postShaders) {
			this.postSelect.options.add(new Option(postShader));
		}
		this.postSelect.addEventListener("change", async (e) => {
			await engine.setPost((e.target as HTMLSelectElement).value);
		})
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
