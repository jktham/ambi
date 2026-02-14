import { Bbox } from "./bbox";
import { Vec3 } from "./vec";

export class Resources {
	private shaders: Map<string, string> = new Map();
	private meshes: Map<string, Float32Array> = new Map();
	private textures: Map<string, ImageData> = new Map();
	private colliders: Map<string, Vec3[][]> = new Map();
	private bboxes: Map<string, Bbox> = new Map();
	private mtls: Map<string, string> = new Map();

	async loadShader(name: string): Promise<string> {
		let cached = this.shaders.get(name);
		if (cached) {
			return cached;
		} else {
			let file = await this.fetchFile(`/shaders/${name}`);
			let processed = await this.preprocessShader(file, `/shaders/${name}`);
			this.shaders.set(name, processed);
			return processed;
		}
	}

	async loadMesh(name: string): Promise<Float32Array> {
		let cached = this.meshes.get(name);
		if (cached) {
			return cached;
		} else {
			try {
				const type = name.split(".").pop() || "";
				if (type == "json") {
					let file = await this.fetchFile(`/meshes/${name}`);
					let data = JSON.parse(file || "[]") as number[];
					let mesh = new Float32Array(data);
					this.meshes.set(name, mesh);
					return mesh;

				} else if (type == "obj") {
					let file = await this.fetchFile(`/meshes/${name}`);
					let data = this.parseObj(file);
					let mesh = new Float32Array(data);
					this.meshes.set(name, mesh);
					return mesh;

				} else {
					throw new Error(`unknown mesh filetype: ${name}`);
				}

			} catch (e) {
				console.error(e);
				return new Float32Array();
			}
		}
	}

	async loadCollider(name: string): Promise<Vec3[][]> {
		let cached = this.colliders.get(name);
		if (cached) {
			return cached;
		} else {
			let mesh = await this.loadMesh(name);
			let collider = this.parseCollider(mesh);
			this.colliders.set(name, collider);
			return collider;
		}
	}

	// returns new bbox without model or mesh, only use min/max
	async loadBbox(name: string): Promise<Bbox> {
		let cached = this.bboxes.get(name);
		if (cached) {
			return cached;
		} else {
			let mesh = await this.loadMesh(name);
			let bbox = this.parseBbox(mesh);
			this.bboxes.set(name, bbox);
			return bbox;
		}
	}

	async loadTexture(name: string): Promise<ImageData> {
		let cached = this.textures.get(name);
		if (cached) {
			return cached;
		} else {
			try {
				const type = name.split(".").pop() || "";
				if (type == "json") {
					let file = await this.fetchFile(`/textures/${name}`);
					let data = JSON.parse(file || "[]") as number[][][];
					if (data[0]?.[0]?.[0] === undefined) {
						throw new Error(`invalid image data: ${name}`);
					}

					const width = data[0].length;
					let imageData = new ImageData(new Uint8ClampedArray(data.flat(2)), width);
					this.textures.set(name, imageData);
					return imageData;

				} else if (["png", "jpg"].includes(type)) {
					let file = await this.fetchFileBase64(`/textures/${name}`);
					let image = new Image();
					image.src = file;
					await image.decode();

					const [width, height] = [image.naturalWidth, image.naturalHeight];
					let canvas = new OffscreenCanvas(width, height);
					let context = canvas.getContext("2d")!;
					context.drawImage(image, 0, 0);
					let imageData = context.getImageData(0, 0, width, height);
					this.textures.set(name, imageData);
					return imageData;

				} else {
					throw new Error(`unknown image filetype: ${name}`);
				}

			} catch (e) {
				console.error(e);
				return new ImageData(1, 1);
			}
		}
	}

	// returns name of first texture in mtl
	async loadMtl(name: string): Promise<string> {
		let cached = this.mtls.get(name);
		if (cached) {
			return cached;
		} else {
			let path = `/meshes/${name}`;
			if (!await this.fileExists(path)) {
				console.warn(`mtl file does not exist: ${path}`);
				this.mtls.set(name, "");
				return "";
			}
			let file = await this.fetchFile(path);
			let texture = this.parseMtl(file);
			this.mtls.set(name, texture);
			return texture;
		}
	}

	private async fileExists(path: string): Promise<boolean> {
		try {
			let res = await fetch(path, { method: "HEAD" });
			return res.ok;
		} catch (e) {
			return false;
		}
	}

	private async fetchFile(path: string): Promise<string> {
		try {
			let res = await fetch(path).then(res => res.text());
			return res;
		} catch (e) {
			console.error(e);
			return "";
		}
	}

	private async fetchFileBase64(path: string): Promise<string> {
		try {
			let blob = await fetch(path).then(res => res.blob());
			let b64 = await new Promise((resolve, _) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result);
				reader.readAsDataURL(blob);
			});
			return b64 as string;
		} catch (e) {
			console.error(e);
			return "";
		}
	}

	private parseObj(file: string): number[] {
		let v: number[][] = [];
		let vc: number[][] = [];
		let vn: number[][] = [];
		let vt: number[][] = [];
		let f: number[][][] = [];

		for (let line of file.split(/\r?\n/)) {
			let words = line.split(" ");
			if (words[0] == "v") {
				v.push(words.slice(1, 4).map(w => parseFloat(w)));
				if (words.length == 7) {
					vc.push([words.slice(4, 7).map(w => parseFloat(w)), 1.0].flat());
				} else {
					vc.push([1.0, 1.0, 1.0, 1.0]);
				}

			} else if (words[0] == "vn") {
				vn.push(words.slice(1, 4).map(w => parseFloat(w)));

			} else if (words[0] == "vt") {
				vt.push(words.slice(1, 3).map(w => parseFloat(w)));

			} else if (words[0] == "f") {
				let face: number[][] = [];
				for (let group of words.slice(1)) {
					let indices = group.split("/").map(i => parseInt(i));
					let vert = [v[indices[0]-1], vn[indices[2]-1], vc[indices[0]-1], indices[1] ? vt[indices[1]-1] : [0, 0]].flat();
					face.push(vert);
				}
				if (face.length > 3) { // we assume convex
					for (let i=2; i<face.length; i++) {
						f.push([face[0], face[i-1], face[i]]);
					}

				} else {
					f.push(face);
				}
			}
		}
		return f.flat(2);
	}

	private parseCollider(mesh: Float32Array): Vec3[][] {
		let collider: Vec3[][] = [];
		for (let i=0; i<mesh.length; i+=12*3) {
			let v0 = new Vec3(mesh[i], mesh[i+1], mesh[i+2]);
			let v1 = new Vec3(mesh[i+12], mesh[i+13], mesh[i+14]);
			let v2 = new Vec3(mesh[i+24], mesh[i+25], mesh[i+26]);
			collider.push([v0, v1, v2]);
		}
		return collider;
	}

	private parseBbox(mesh: Float32Array): Bbox {
		let min = new Vec3(Infinity, Infinity, Infinity);
		let max = new Vec3(-Infinity, -Infinity, -Infinity);

		for (let i=0; i<mesh.length; i+=12) {
			let v = new Vec3(mesh[i], mesh[i+1], mesh[i+2]);
			min.x = Math.min(min.x, v.x);
			min.y = Math.min(min.y, v.y);
			min.z = Math.min(min.z, v.z);
			max.x = Math.max(max.x, v.x);
			max.y = Math.max(max.y, v.y);
			max.z = Math.max(max.z, v.z);
		}

		return new Bbox([min, max]);
	}

	private parseMtl(file: string): string {
		for (let line of file.split(/\r?\n/)) {
			let words = line.split(" ");
			if (words[0] == "map_Kd") {
				let abs = words[1];
				if (!abs.includes("textures/")) {
					console.warn(`texture path in mtl does not include "textures/": ${abs}`);
					return "";
				}
				let rel = abs.split("textures/").slice(1).join("");
				return rel;
			}
		}
		console.warn(`did not find map_Kd in mtl: ${file}`);
		return "";
	}

	private async preprocessShader(file: string, path: string): Promise<string> {
		let out = "";
		for (let line of file.split(/\r?\n/)) {
			if (line.startsWith("#import ")) {
				let currentPath = path.split("/").slice(0, -1).join("/").replace("/shaders/", "") + "/";
				let importPath = line.replace(/#import\s+/, "").replace(/"/g, "");
				line = await this.loadShader(currentPath + importPath);
			}
			out += line + "\n";
		}
		return out;
	}

	clear() {
		this.shaders.clear();
		this.meshes.clear();
		this.textures.clear();
		this.colliders.clear();
		this.mtls.clear();
	}
}
