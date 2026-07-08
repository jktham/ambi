import { Bbox } from "./bbox";
import { Vec2, Vec3 } from "./vec";

/** path relative to public/shaders/ */
export type VertShaderPath = `${string}.vert.wgsl`;
/** path relative to public/shaders/ */
export type FragShaderPath = `${string}.frag.wgsl`;
/** path relative to public/shaders/ */
export type ShaderPath = `${string}.wgsl`;
/** path relative to public/meshes/ */
export type MeshPath = `${string}.obj` | `${string}.json`;
/** path relative to public/textures/ */
export type TexturePath = `${string}.png` | `${string}.jpg` | `${string}.json`;
/** path relative to public/meshes/ */
export type MtlPath = `${string}.mtl`;

const ERROR_MESH: MeshPath = "error.obj";
const ERROR_COLLIDER: MeshPath = "cube.obj";
const ERROR_TEXTURE: TexturePath = "error.png";

export const MESH_STRIDE = 15;

/** loads, processes and caches assets */
export class Assets {
	private shaders: Map<ShaderPath, string> = new Map();
	private meshes: Map<MeshPath, Float32Array> = new Map();
	private textures: Map<TexturePath, ImageData> = new Map();
	private colliders: Map<MeshPath, Vec3[][]> = new Map();
	private bboxes: Map<MeshPath, Bbox> = new Map();
	private mtls: Map<MtlPath, TexturePath> = new Map();


	/** load .wgsl shader from public/shaders/ */
	async loadShader(name: ShaderPath): Promise<string> {
		if (this.shaders.has(name)) {
			return this.shaders.get(name)!;
		}

		if (!await this.fileExists(`/shaders/${name}`)) {
			throw new Error(`shader does not exist: ${name}`); // cant recover from this really
		}
		
		let file = await this.fetchFile(`/shaders/${name}`);
		let processed = await this.preprocessShader(file, `/shaders/${name}`);
		this.shaders.set(name, processed);
		return processed;
	}

	/** load .obj or .json mesh from public/meshes/ */
	async loadMesh(name: MeshPath): Promise<Float32Array> {
		if (this.meshes.has(name)) {
			return this.meshes.get(name)!;
		}

		if (!await this.fileExists(`/meshes/${name}`)) {
			console.warn(`mesh does not exist: ${name}`);
			return this.loadMesh(ERROR_MESH);
		}

		const type = name.split(".").pop() || "";
		if (type == "json") {
			let file = await this.fetchFile(`/meshes/${name}`);
			let data = JSON.parse(file || "[]") as number[]; // should be list of vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz)
			let mesh = new Float32Array(data);
			this.meshes.set(name, mesh);
			return mesh;

		} else if (type == "obj") {
			let file = await this.fetchFile(`/meshes/${name}`);
			let mesh = this.parseObj(name, file);
			this.meshes.set(name, mesh);
			return mesh;

		} else {
			console.warn(`unknown mesh type: ${name}`);
			return this.loadMesh(ERROR_MESH);
		}
	}

	/** generate collider based on .obj or .json mesh from public/meshes/ */
	async loadCollider(name: MeshPath): Promise<Vec3[][]> {
		if (this.colliders.has(name)) {
			return this.colliders.get(name)!;
		}

		if (!await this.fileExists(`/meshes/${name}`)) {
			console.warn(`collider mesh does not exist: ${name}`);
			let mesh = await this.loadMesh(ERROR_COLLIDER);
			let collider = this.parseCollider(ERROR_COLLIDER, mesh);
			return collider;
		}
		
		let mesh = await this.loadMesh(name);
		let collider = this.parseCollider(name, mesh);
		this.colliders.set(name, collider);
		return collider;
	}

	/** returns new bbox based on .obj or .json mesh, only populates min/max */
	async loadBbox(name: MeshPath): Promise<Bbox> {
		if (this.bboxes.has(name)) {
			return this.bboxes.get(name)!;
		}

		if (!await this.fileExists(`/meshes/${name}`)) {
			console.warn(`bbox mesh does not exist: ${name}`);
			let mesh = await this.loadMesh(ERROR_COLLIDER);
			let bbox = this.parseBbox(ERROR_COLLIDER, mesh);
			return bbox;
		}

		let mesh = await this.loadMesh(name);
		let bbox = this.parseBbox(name, mesh);
		this.bboxes.set(name, bbox);
		return bbox;
	}

	/** load .png, .jpg or .json texture from public/textures/ */
	async loadTexture(name: TexturePath): Promise<ImageData> {
		if (this.textures.has(name)) {
			return this.textures.get(name)!;
		}

		if (!await this.fileExists(`/textures/${name}`)) {
			console.warn(`texture does not exist: ${name}`);
			return this.loadTexture(ERROR_TEXTURE);
		}
		
		const type = name.split(".").pop() || "";
		if (type == "json") {
			let file = await this.fetchFile(`/textures/${name}`);
			let data = JSON.parse(file || "[]") as number[][][]; // should be [r, g, b, a][m][n] as 0..=255
			if (data[0]?.[0]?.[0] === undefined) {
				console.warn(`invalid texture data: ${name}`);
				return this.loadTexture(ERROR_TEXTURE);
			}

			const width = data[0].length;
			let imageData = new ImageData(new Uint8ClampedArray(data.flat(2)), width);
			this.textures.set(name, imageData);
			return imageData;

		} else if (["png", "jpg"].includes(type)) {
			try {
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

			} catch (e) {
				console.warn(`invalid texture data: ${name}`);
				return this.loadTexture(ERROR_TEXTURE);
			}

		} else {
			console.warn(`unknown texture type: ${name}`);
			return this.loadTexture(ERROR_TEXTURE);
		}
	}

	/** returns path of first map_Kd entry relative to public/, for basic diffuse map selection */
	async loadMtl(name: MtlPath): Promise<TexturePath> {
		if (this.mtls.has(name)) {
			return this.mtls.get(name)!;
		}

		if (!await this.fileExists(`/meshes/${name}`)) {
			console.warn(`mtl does not exist: ${name}`);
			return ERROR_TEXTURE;
		}

		let file = await this.fetchFile(`/meshes/${name}`);
		let texture = this.parseMtl(name, file);
		this.mtls.set(name, texture);
		return texture;
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
	private parseObj(name: MeshPath, file: string): Float32Array {
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
					console.warn(`invalid mesh face: ${name}, ${face}`);
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
	private parseCollider(name: MeshPath, mesh: Float32Array): Vec3[][] {
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
	private parseBbox(name: MeshPath, mesh: Float32Array): Bbox {
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

	/** returns path of first map_Kd entry relative to public/textures/, for basic diffuse map selection */
	private parseMtl(name: MtlPath, file: string): TexturePath {
		for (let line of file.split(/\r?\n/)) {
			let words = line.split(" ");
			if (words[0] == "map_Kd") {
				let abs = words[1];
				if (!abs.includes("textures/")) {
					console.warn(`texture path in mtl does not include "textures/": ${name}, ${abs}`);
					return ERROR_TEXTURE;
				}
				if (!(abs.endsWith(".png") || abs.endsWith(".jpg"))) {
					console.warn(`texture path in mtl does not end in .png or .jpg: ${name}, ${abs}`);
					return ERROR_TEXTURE;
				}
				let rel = abs.split("textures/").slice(1).join("");
				return rel as TexturePath;
			}
		}
		console.warn(`did not find map_Kd in mtl: ${name}`);
		return ERROR_TEXTURE;
	}

	/** resolve #import in shaders relative to its path */
	private async preprocessShader(file: string, path: string): Promise<string> {
		let out = "";
		for (let line of file.split(/\r?\n/)) {
			if (line.startsWith("#import ")) {
				let currentPath = path.split("/").slice(0, -1).join("/").replace("/shaders/", "") + "/";
				let importPath = line.replace(/#import\s+/, "").replace(/"/g, "");
				line = await this.loadShader(currentPath + importPath as ShaderPath);
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
