import { Bbox } from "./bbox";
import { Vec2, Vec3 } from "./vec";

/** supported shader filetypes */
const shaderTypes = ["wgsl"] as const;
type ShaderTypes = typeof shaderTypes[number];

/** path relative to public/shaders/ */
export type VertShaderPath = `${string}.vert.${ShaderTypes}`;
/** path relative to public/shaders/ */
export type FragShaderPath = `${string}.frag.${ShaderTypes}`;
/** path relative to public/shaders/ */
export type ShaderPath = `${string}.${ShaderTypes}`;

/** supported mesh filetypes */
const meshTypes = ["obj", "json"] as const;
type MeshTypes = typeof meshTypes[number];

/** path relative to public/meshes/ */
export type MeshPath = `${string}.${MeshTypes}`;

/** supported texture filetypes */
const textureTypes = ["png", "jpg", "json"] as const;
type TextureTypes = typeof textureTypes[number];

/** special labels that are replaced before asset load */
export type TextureLabel = `@${"diffuse" | "normal"}`;

/** path relative to public/textures/ or material texture label */
export type TexturePath = `${string}.${TextureTypes}` | TextureLabel;

/** supported material filetypes */
const materialTypes = ["mtl"] as const;
type MaterialTypes = typeof materialTypes[number];

/** path relative to public/meshes/ */
export type MaterialPath = `${string}.${MaterialTypes}`;

// floats per vertex
export const MESH_STRIDE = 15;

/** loads, processes and caches assets */
export class Assets {
	private shaders: Map<ShaderPath, string> = new Map();
	private meshes: Map<MeshPath, Float32Array> = new Map();
	private textures: Map<TexturePath, ImageData> = new Map();
	private colliders: Map<MeshPath, Vec3[][]> = new Map();
	private bboxes: Map<MeshPath, Bbox> = new Map();
	private materials: Map<MaterialPath, Map<TextureLabel, TexturePath>> = new Map();


	/** load .wgsl shader from public/shaders/ */
	async loadShader(path: ShaderPath): Promise<string> {
		if (this.shaders.has(path)) {
			return this.shaders.get(path)!;
		}

		const type = (path.split(".").pop() || "") as ShaderTypes;
		if (!shaderTypes.includes(type)) {
			throw new Error(`unknown shader type: ${path}`);
		}

		if (!await this.fileExists(`/shaders/${path}`)) {
			throw new Error(`shader does not exist: ${path}`);
		}
		
		let file = await this.fetchFile(`/shaders/${path}`);
		let processed = await this.preprocessShader(`/shaders/${path}`, file);
		this.shaders.set(path, processed);
		return processed;
	}

	/** load .obj or .json mesh from public/meshes/ */
	async loadMesh(path: MeshPath): Promise<Float32Array> {
		if (this.meshes.has(path)) {
			return this.meshes.get(path)!;
		}

		const type = (path.split(".").pop() || "") as MeshTypes;
		if (!meshTypes.includes(type)) {
			throw new Error(`unknown mesh type: ${path}`);
		}

		if (!await this.fileExists(`/meshes/${path}`)) {
			throw new Error(`mesh does not exist: ${path}`);
		}

		switch (type) {
			case "obj": { // braces for block scoped variables
				let file = await this.fetchFile(`/meshes/${path}`);
				let mesh = this.parseObj(path, file);
				this.meshes.set(path, mesh);
				return mesh;
			}
			case "json": {
				let file = await this.fetchFile(`/meshes/${path}`);
				let data = JSON.parse(file || "[]") as number[]; // should be list of vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz)
				let mesh = new Float32Array(data);
				this.meshes.set(path, mesh);
				return mesh;
			}
		}
	}

	/** generate collider based on .obj or .json mesh from public/meshes/ */
	async loadCollider(path: MeshPath): Promise<Vec3[][]> {
		if (this.colliders.has(path)) {
			return this.colliders.get(path)!;
		}

		const type = (path.split(".").pop() || "") as MeshTypes;
		if (!meshTypes.includes(type)) {
			throw new Error(`unknown collider mesh type: ${path}`);
		}

		if (!await this.fileExists(`/meshes/${path}`)) {
			throw new Error(`collider mesh does not exist: ${path}`);
		}
		
		let mesh = await this.loadMesh(path);
		let collider = this.parseCollider(path, mesh);
		this.colliders.set(path, collider);
		return collider;
	}

	/** returns new bbox based on .obj or .json mesh, only populates min/max */
	async loadBbox(path: MeshPath): Promise<Bbox> {
		if (this.bboxes.has(path)) {
			return this.bboxes.get(path)!;
		}

		const type = (path.split(".").pop() || "") as MeshTypes;
		if (!meshTypes.includes(type)) {
			throw new Error(`unknown bbox mesh type: ${path}`);
		}

		if (!await this.fileExists(`/meshes/${path}`)) {
			throw new Error(`bbox mesh does not exist: ${path}`);
		}

		let mesh = await this.loadMesh(path);
		let bbox = this.parseBbox(path, mesh);
		this.bboxes.set(path, bbox);
		return bbox;
	}

	/** load .png, .jpg or .json texture from public/textures/ */
	async loadTexture(path: TexturePath): Promise<ImageData> {
		if (this.textures.has(path)) {
			return this.textures.get(path)!;
		}

		if (path.startsWith("@")) {
			throw new Error(`unresolved texture label: ${path}`);
		}

		const type = (path.split(".").pop() || "") as TextureTypes;
		if (!textureTypes.includes(type)) {
			throw new Error(`unknown texture type: ${path}`);
		}

		if (!await this.fileExists(`/textures/${path}`)) {
			throw new Error(`texture does not exist: ${path}`);
		}
		
		switch (type) {
			case "png":
			case "jpg": {
				try {
					let file = await this.fetchFileBase64(`/textures/${path}`);
					let image = new Image();
					image.src = file;
					await image.decode();

					const [width, height] = [image.naturalWidth, image.naturalHeight];
					let canvas = new OffscreenCanvas(width, height);
					let context = canvas.getContext("2d")!;
					context.drawImage(image, 0, 0);
					let imageData = context.getImageData(0, 0, width, height);
					this.textures.set(path, imageData);
					return imageData;

				} catch (e) {
					throw new Error(`invalid texture data: ${path}`);
				}
			}
			case "json": {
				let file = await this.fetchFile(`/textures/${path}`);
				let data = JSON.parse(file || "[]") as number[][][]; // should be [r, g, b, a][width][height] as 0..=255
				if (data[0]?.[0]?.[0] === undefined) {
					throw new Error(`invalid texture data: ${path}`);
				}

				const width = data[0].length;
				let imageData = new ImageData(new Uint8ClampedArray(data.flat(2)), width);
				this.textures.set(path, imageData);
				return imageData;
			}
		}
	}

	/** returns map of texture labels to texture paths defined in .mtl */
	async loadMaterial(path: MaterialPath): Promise<Map<TextureLabel, TexturePath>> {
		if (this.materials.has(path)) {
			return this.materials.get(path)!;
		}

		const type = (path.split(".").pop() || "") as MaterialTypes;
		if (!materialTypes.includes(type)) {
			throw new Error(`unknown mtl type: ${path}`);
		}

		if (!await this.fileExists(`/meshes/${path}`)) {
			throw new Error(`mtl does not exist: ${path}`);
		}

		let file = await this.fetchFile(`/meshes/${path}`);
		let material = this.parseMaterial(path, file);
		this.materials.set(path, material);
		return material;
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

	/** parses .obj file as string, returns flat f32 array of triangulates vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz) */
	private parseObj(path: MeshPath, file: string): Float32Array {
		let v: number[][] = []; // vertex pos xyz
		let vc: number[][] = []; // vertex color rgba
		let vn: number[][] = []; // vertex normal xyz
		let vt: number[][] = []; // vertex texcoord uv
		let f: number[][][] = []; // faces, list of [v1, v2, v3]

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
					let iv = indices[0];
					let ivc = indices[0];
					let ivn = indices[2];
					let ivt = indices[1];

					let pos = v[iv-1];
					let normal = vn[ivn-1];
					let color = vc[ivc-1];
					let uv = ivt ? vt[ivt-1] : [0, 0];
					let tangent = [0, 0, 0];

					let vert = [pos, normal, color, uv, tangent].flat();
					face.push(vert);
				} if (face.length == 3) {
					f.push(face);
				} else if (face.length > 3) { // we assume convex
					for (let i=2; i<face.length; i++) { // triangulate ngons
						f.push([face[0], face[i-1], face[i]]);
					}
				} else {
					console.warn(`invalid mesh face: ${path}, ${face}`);
				}
			}
		}

		// compute tangent as in https://learnopengl.com/Advanced-Lighting/Normal-Mapping
		for (let i = 0; i < f.length; i++) {
			let v1 = f[i][0];
			let v2 = f[i][1];
			let v3 = f[i][2];

			let edge1 = new Vec3(v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]);
			let edge2 = new Vec3(v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]);
			let duv1 = new Vec2(v2[10] - v1[10], v2[11] - v1[11]);
			let duv2 = new Vec2(v3[10] - v1[10], v3[11] - v1[11]);

			let tangent = new Vec3();
			let fract = 1.0 / (duv1.x * duv2.y - duv2.x * duv1.y);

			tangent.x = fract * (duv2.y * edge1.x - duv1.y * edge2.x);
			tangent.y = fract * (duv2.y * edge1.y - duv1.y * edge2.y);
			tangent.z = fract * (duv2.y * edge1.z - duv1.y * edge2.z);
			tangent = tangent.normalize();

			for (let j = 0; j < 3; j++) {
				f[i][0][j+12] = tangent.data[j];
				f[i][1][j+12] = tangent.data[j];
				f[i][2][j+12] = tangent.data[j];
			}
		}

		let mesh = f.flat(2);
		return new Float32Array(mesh);
	}

	/** returns 2d list of vertex positions from full mesh array */
	private parseCollider(path: MeshPath, mesh: Float32Array): Vec3[][] {
		let collider: Vec3[][] = [];
		let s = MESH_STRIDE;
		for (let i=0; i<mesh.length; i+=s*3) {
			let v0 = new Vec3(mesh[i], mesh[i+1], mesh[i+2]);
			let v1 = new Vec3(mesh[i+s], mesh[i+s+1], mesh[i+s+2]);
			let v2 = new Vec3(mesh[i+2*s], mesh[i+2*s+1], mesh[i+2*s+2]);
			collider.push([v0, v1, v2]);
		}
		return collider;
	}

	/** returns min/max of vertex positions */
	private parseBbox(path: MeshPath, mesh: Float32Array): Bbox {
		let min = new Vec3(Infinity, Infinity, Infinity);
		let max = new Vec3(-Infinity, -Infinity, -Infinity);

		for (let i=0; i<mesh.length; i+=MESH_STRIDE) {
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

	/** parse .mtl and return map of found texture labels to texture paths */
	private parseMaterial(path: MaterialPath, file: string): Map<TextureLabel, TexturePath> {
		let maps = new Map<TextureLabel, TexturePath>();
		for (let line of file.split(/\r?\n/)) {
			let words = line.split(" ");
			switch (words[0].toLowerCase()) {
				case "map_kd": {
					let abs = words[1];
					if (!abs.includes("textures/")) {
						console.warn(`diffuse map texture path in mtl does not include "textures/": ${path}, ${abs}`);
						continue;
					}
					let rel = abs.split("textures/").slice(1).join("");
					maps.set("@diffuse", rel as TexturePath);
					break;
				}
				case "map_bump": {
					let abs = words[3];
					if (!abs.includes("textures/")) {
						console.warn(`normal map texture path in mtl does not include "textures/": ${path}, ${abs}`);
						continue;
					}
					let rel = abs.split("textures/").slice(1).join("");
					maps.set("@normal", rel as TexturePath);
					break;
				}
			}
		}
		return maps;
	}

	/** resolve #import in shaders relative to its path */
	private async preprocessShader(path: ShaderPath, file: string): Promise<string> {
		let out = "";
		for (let line of file.split(/\r?\n/)) {
			if (line.startsWith("#import ")) {
				let currentPath = path.split("/").slice(0, -1).join("/").replace("/shaders/", "") + "/";
				let relPath = line.replace(/#import\s+/, "").replace(/"/g, "");
				let absPath = currentPath + relPath;
				line = await this.loadShader(absPath as ShaderPath);
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
		this.materials.clear();
	}
}
