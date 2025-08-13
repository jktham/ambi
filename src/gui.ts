import { cameraModes, type CameraMode } from "./camera";
import { postShaders, scenes } from "./data";
import type { Engine } from "./engine";
import { Uniforms } from "./uniforms";

export class Gui {
	private info: HTMLSpanElement = document.getElementById("gui-info")! as HTMLSpanElement;
	private sceneSelect: HTMLSelectElement = document.getElementById("gui-scene-select")! as HTMLSelectElement;
	private postSelect: HTMLSelectElement = document.getElementById("gui-post-select")! as HTMLSelectElement;
	private modeSelect: HTMLSelectElement = document.getElementById("gui-mode-select")! as HTMLSelectElement;
	private keyboardInput: HTMLInputElement = document.getElementById("gui-keyboard-input")! as HTMLInputElement;
	private uniformConfig: HTMLDivElement = document.getElementById("gui-uniforms")! as HTMLDivElement;

	private inputKeyUpHandles: Map<string, number> = new Map();

	constructor(engine: Engine) {
		for (let scene of scenes.keys()) {
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
		for (let postShader of postShaders.keys()) {
			this.postSelect.options.add(new Option(postShader));
		}
		this.postSelect.addEventListener("change", async (e) => {
			let value = (e.target as HTMLSelectElement).value;
			await engine.setPost(value, new (postShaders.get(value) ?? Uniforms));
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

	setPost(currentShader: string, sceneShader: string, uniforms: Uniforms) {
		this.postSelect.value = currentShader;
		if (currentShader == "scene") {
			this.postSelect.options[0].label = `scene (${sceneShader})`;
		}
		this.initUniformConfig(uniforms);
	}

	setMode(mode: CameraMode) {
		this.modeSelect.value = mode;
	}

	// this is awful i'll improve it at some point i hope
	private initUniformConfig(uniforms: Uniforms) {
		this.uniformConfig.textContent = "";
		let name = document.createElement("span");
		name.textContent = uniforms.constructor.name;
		this.uniformConfig.appendChild(name);

		for (let [k, v] of Object.entries(uniforms)) {
			const blacklist = ["useStorageBuffer", "instanceCount"];
			if (blacklist.includes(k)) {
				continue;
			}
			let row = document.createElement("div");
			let label = document.createElement("span");
			let input = document.createElement("input");
			row.className = "row";
			label.textContent = k + ": ";

			if (typeof v == "number") {
				input.type = "number";
				input.value = v.toString();
				input.addEventListener("change", e => {
					// @ts-ignore :)
					uniforms[k] = Number((e.target as HTMLInputElement).value);
				});
				label.textContent += "number";

			} else if (typeof v == "boolean") {
				input.type = "checkbox";
				input.checked = v;
				input.addEventListener("change", e => {
					// @ts-ignore :)
					uniforms[k] = (e.target as HTMLInputElement).checked;
				});
				label.textContent += "boolean";

			} else if (["Vec2", "Vec3", "Vec4", "Mat4"].includes(v.constructor.name)) {
				input.type = "text";
				input.value = v.data.toString();
				input.addEventListener("change", e => {
					// @ts-ignore :)
					uniforms[k].data = (e.target as HTMLInputElement).value.split(",").map(Number);
				});
				label.textContent += v.constructor.name;

			} else if (Array.isArray(v)) {
				if (v.length > 0 && typeof v[0] == "number") {
					input.type = "text";
					input.value = v.join(";");
					input.addEventListener("change", e => {
						// @ts-ignore :)
						uniforms[k] = (e.target as HTMLInputElement).value.split(";").map(Number);
					});
					label.textContent += "number[]";

				} else if (v.length > 0 && typeof v[0] == "boolean") {
					input.type = "text";
					input.value = v.join(";");
					input.addEventListener("change", e => {
						// @ts-ignore :)
						uniforms[k] = (e.target as HTMLInputElement).value.split(";").map(Boolean);
					});
					label.textContent += "boolean[]";

				} else if (v.length > 0 && ["Vec2", "Vec3", "Vec4", "Mat4"].includes(v[0].constructor.name)) {
					input.type = "text";
					input.value = v.map(v => v.data.toString()).join(";");
					input.addEventListener("change", e => {
						let data = (e.target as HTMLInputElement).value.split(";").map(s => s.split(",").map(Number));
						// @ts-ignore :)
						for (let i=0; i<data.length; i++) {
						// @ts-ignore :)
							uniforms[k][i].data = data[i];
						}
					});
					label.textContent += v[0].constructor.name + "[]";
				}
			}
			
			row.appendChild(label);
			row.appendChild(input);
			this.uniformConfig.appendChild(row);
		}
	}
}
