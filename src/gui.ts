import type { Engine } from "./engine";
import { scenes } from "./scene";

export class Gui {
	private info: HTMLSpanElement = document.getElementById("gui-info")! as HTMLSpanElement;
	private sceneSelect: HTMLSelectElement = document.getElementById("gui-scene-select")! as HTMLSelectElement;

	constructor(engine: Engine) {
		for (let name of scenes) {
			this.sceneSelect.options.add(new Option(name));
		}
		this.sceneSelect.addEventListener("change", async (e) => {
			await engine.setScene((e.target as HTMLSelectElement).value);
		})
	}

	public updateInfo(deltaTime: number, sceneName: string) {
		this.info.textContent = `scene: ${sceneName}, fps: ${(1/deltaTime).toFixed(2)}`;
	}

	public setScene(name: string) {
		this.sceneSelect.value = name;
	}
}
