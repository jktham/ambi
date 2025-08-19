import { cameraModes, type CameraMode } from "./camera";
import { postShaders, resolutionPresets, scenes } from "./data";
import type { Engine } from "./engine";
import { Uniforms } from "./uniforms";
import { Vec2 } from "./vec";

export class Gui {
	private engine: Engine;
	private info: HTMLSpanElement = document.getElementById("gui-info")! as HTMLSpanElement;
	private sceneSelect: HTMLSelectElement = document.getElementById("gui-scene-select")! as HTMLSelectElement;
	private postSelect: HTMLSelectElement = document.getElementById("gui-post-select")! as HTMLSelectElement;
	private cameraModeSelect: HTMLSelectElement = document.getElementById("gui-camera-mode-select")! as HTMLSelectElement;
	private resolutionInputX: HTMLInputElement = document.getElementById("gui-resolution-input-x")! as HTMLInputElement;
	private resolutionInputY: HTMLInputElement = document.getElementById("gui-resolution-input-y")! as HTMLInputElement;
	private resolutionSelect: HTMLSelectElement = document.getElementById("gui-resolution-select")! as HTMLSelectElement;
	private keyboardInput: HTMLInputElement = document.getElementById("gui-keyboard-input")! as HTMLInputElement;
	private uniformConfig: HTMLDivElement = document.getElementById("gui-uniforms")! as HTMLDivElement;

	private inputKeyUpHandles: Map<string, number> = new Map();
	private uniformSizes: Map<string, number> = new Map();

	constructor(engine: Engine) {
		this.engine = engine;

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
			await engine.setPost(value, new (postShaders.get(value)?.[0] ?? Uniforms), postShaders.get(value)?.[1] ?? []);
		});
		this.postSelect.addEventListener("keydown", (e) => {
			if (e.key.length == 1 && !e.ctrlKey) {
				e.preventDefault();
			}
		});

		for (let mode of cameraModes) {
			this.cameraModeSelect.options.add(new Option(mode));
		}
		this.cameraModeSelect.addEventListener("change", async (e) => {
			let mode = (e.target as HTMLSelectElement).value as CameraMode;
			engine.setCameraMode(mode);
		});
		this.cameraModeSelect.addEventListener("keydown", (e) => {
			if (e.key.length == 1 && !e.ctrlKey) {
				e.preventDefault();
			}
		});

		[this.resolutionInputX, this.resolutionInputY].map(i => i.addEventListener("change", async (e) => {
			let resolution = new Vec2(Math.max(1, Number(this.resolutionInputX.value) || 1), Math.max(1, Number(this.resolutionInputY.value) || 1));
			await engine.setResolution(resolution);
		}));

		this.resolutionSelect.options.add(new Option("custom", ""));
		for (let [k, v] of resolutionPresets) {
			this.resolutionSelect.options.add(new Option(k, v));
		}
		this.resolutionSelect.addEventListener("change", async (e) => {
			if (this.resolutionSelect.value == "") return;
			let data = this.resolutionSelect.value.split("x").map(Number);
			let resolution = new Vec2(data[0], data[1]);
			await engine.setResolution(resolution);
		});
		this.resolutionSelect.addEventListener("keydown", (e) => {
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

		addEventListener("keydown", (e) => {
			if ((e.target as HTMLElement).nodeName == "INPUT") {
				return;
			}
			if (!isNaN(Number(e.key)) && Number(e.key) < this.sceneSelect.options.length) {
				this.sceneSelect.value = this.sceneSelect.options[Number(e.key)].value;
				this.sceneSelect.dispatchEvent(new Event("change"));
			} else if (e.key.toLowerCase() == "p") {
				this.postSelect.value = this.postSelect.options[(this.postSelect.selectedIndex + 1) % this.postSelect.options.length].value;
				this.postSelect.dispatchEvent(new Event("change"));
			} else if (e.key.toLowerCase() == "m") {
				this.cameraModeSelect.value = this.cameraModeSelect.options[(this.cameraModeSelect.selectedIndex + 1) % this.cameraModeSelect.options.length].value;
				this.cameraModeSelect.dispatchEvent(new Event("change"));
			}
		});
	}

	updateInfo(text: string) {
		this.info.textContent = text;
	}

	updateScene(name: string) {
		this.sceneSelect.value = name;
	}

	updatePost(currentShader: string, sceneShader: string, uniforms: Uniforms, textures: string[]) {
		this.postSelect.value = currentShader;
		if (currentShader == "scene") {
			this.postSelect.options[0].label = `scene (${sceneShader})`;
		}
		this.initUniformConfig(currentShader, uniforms, textures);
	}

	updateCameraMode(cameraMode: CameraMode) {
		this.cameraModeSelect.value = cameraMode;
	}

	updateResolution(resolution: Vec2) {
		this.resolutionInputX.value = resolution.x.toString();
		this.resolutionInputY.value = resolution.y.toString();
		let res = `${resolution.x}x${resolution.y}`;
		if ([...resolutionPresets.values()].includes(res)) {
			this.resolutionSelect.value = res;
		} else {
			this.resolutionSelect.value = "";
		}
		
	}

	// this is awful i'll improve it at some point i hope
	private initUniformConfig(shader: string, uniforms: Uniforms, textures: string[]) {
		this.uniformSizes.clear();
		this.uniformConfig.textContent = "";
		if (uniforms.size() == 0 && textures.length == 0) {
			return;
		}

		let name = document.createElement("span");
		name.textContent = uniforms.name;
		this.uniformConfig.appendChild(name);

		for (let [k, v] of Object.entries(uniforms)) {
			const blacklist = ["useStorageBuffer", "instanceCount", "name"];
			if (blacklist.includes(k)) {
				continue;
			}
			let row = document.createElement("div");
			let label = document.createElement("span");
			let input = document.createElement("input");
			row.className = "row";
			label.textContent = k + ": ";

			let uniData = (uniforms as any);

			if (typeof v == "number") {
				input.type = "number";
				input.value = v.toString();
				input.addEventListener("change", e => {
					if ((e.target as HTMLInputElement).value == "") (e.target as HTMLInputElement).value = "0";
					(e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^\d.]/g, "");
					uniData[k] = Number((e.target as HTMLInputElement).value);
				});
				label.textContent += "number";

			} else if (typeof v == "boolean") {
				input.type = "checkbox";
				input.checked = v;
				input.addEventListener("change", e => {
					(e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^\w]/g, "");
					uniData[k] = (e.target as HTMLInputElement).checked;
				});
				label.textContent += "boolean";

			} else if ([2, 3, 4, 16].includes(v?.size)) {
				input.type = "text";
				input.value = v.data.toString();
				input.addEventListener("change", e => {
					(e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^\d.,]/g, "");
					uniData[k].data = (e.target as HTMLInputElement).value.split(",").map(Number).concat(new Array(uniData[k].size).fill(0)).slice(0, uniData[k].size);
					(e.target as HTMLInputElement).value = uniData[k].data.toString();
				});
				let types: Map<number, string> = new Map([
					[2, "vec2"],
					[3, "vec3"],
					[4, "vec4"],
					[16, "mat4"],
				]);
				label.textContent += types.get(v?.size);

			} else if (Array.isArray(v)) {
				this.uniformSizes.set(k, uniData[k].length);
				if (v.length > 0 && typeof v[0] == "number") {
					input.type = "text";
					input.value = v.join(",");
					input.addEventListener("change", e => {
						(e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^\d.,]/g, "");
						uniData[k] = (e.target as HTMLInputElement).value.split(",").map(Number).concat(new Array(this.uniformSizes.get(k)).fill(0)).slice(0, this.uniformSizes.get(k));
						(e.target as HTMLInputElement).value = uniData[k].join(",");
					});
					label.textContent += `number[${this.uniformSizes.get(k)}]`;

				} else if (v.length > 0 && typeof v[0] == "boolean") {
					input.type = "text";
					input.value = v.join(",");
					input.addEventListener("change", e => {
						(e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^\w,]/g, "");
						uniData[k] = (e.target as HTMLInputElement).value.split(",").map(Boolean).concat(new Array(this.uniformSizes.get(k)).fill(false)).slice(0, this.uniformSizes.get(k));
						(e.target as HTMLInputElement).value = uniData[k].join(",");
					});
					label.textContent += `boolean[${this.uniformSizes.get(k)}]`;

				} else if (v.length > 0 && [2, 3, 4, 16].includes(v[0]?.size)) {
					input.type = "text";
					input.value = v.map(v => v.data.join(",")).join("; ");
					input.addEventListener("change", e => {
						(e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^\d.,;]/g, "");
						// @ts-ignore :)
						let data = (e.target as HTMLInputElement).value.split(";").map((s, i) => s.split(",").map(Number).concat(new Array(uniData[k][i]?.size ?? 16).fill(0)).slice(0, uniData[k][i]?.size ?? 16)).concat(new Array(this.uniformSizes.get(k)).fill(new Array(16).fill(0))).slice(0, this.uniformSizes.get(k));
						for (let i=0; i<data.length; i++) {
							uniData[k][i].data = data[i].slice(0, uniData[k][i]?.size ?? 16);
						}
						(e.target as HTMLInputElement).value = uniData[k].map((v: any) => v.data.join(",")).join("; ");
					});
					let types: Map<number, string> = new Map([
						[2, "vec2"],
						[3, "vec3"],
						[4, "vec4"],
						[16, "mat4"],
					]);
					label.textContent += `${types.get(v[0]?.size)}[${this.uniformSizes.get(k)}]`;
				}
			}
			
			row.appendChild(label);
			row.appendChild(input);
			this.uniformConfig.appendChild(row);
		}

		this.uniformSizes.set("textures", textures.length);
		if (textures.length > 0) {
			let row = document.createElement("div");
			let label = document.createElement("span");
			let input = document.createElement("input");
			row.className = "row";

			label.textContent = `textures: string[${this.uniformSizes.get("textures")}]`;
			input.type = "text";
			input.value = textures.join(";");
			input.addEventListener("change", async e => {
				let value = (e.target as HTMLInputElement).value.split(";").filter(s => s != "").concat(new Array(this.uniformSizes.get("textures")).fill("house.jpg")).slice(0, this.uniformSizes.get("textures"));
				await this.engine.setPost(shader, uniforms, value);
			});
				
			row.appendChild(label);
			row.appendChild(input);
			this.uniformConfig.appendChild(row);
		}
	}
}
