import { Bbox } from "./bbox";
import { parseMeshOBJ, parseCollider, parseBbox, parseMaterialMTL, parseFontFNT, parseMeshJSON, parseTextureJSON, parseTexturePNGJPG } from "./parse";
import { Vec2, Vec3, Vec4 } from "./vec";

/** supported shader filetypes */
const shaderTypes = ["wgsl"] as const;
type ShaderTypes = typeof shaderTypes[number];

/** path relative to public/shaders/ */
export type ShaderPath = `${string}.${ShaderTypes}`;
/** path relative to public/shaders/ */
export type VertShaderPath = `${string}.vert.${ShaderTypes}`;
/** path relative to public/shaders/ */
export type FragShaderPath = `${string}.frag.${ShaderTypes}`;


/** supported mesh filetypes */
const meshTypes = ["obj", "json"] as const;
type MeshTypes = typeof meshTypes[number];

/** path relative to public/meshes/ */
export type MeshPath = `${string}.${MeshTypes}`;


/** supported texture filetypes */
const textureTypes = ["png", "jpg", "json"] as const;
type TextureTypes = typeof textureTypes[number];

/** special labels from renderer that are intercepted before asset load */
export type BuiltinTextureLabel = `$${"shadowmap" | "framebuffer" | `portal_${number}`}`;

/** path relative to public/textures/ */
export type TexturePath = `${string}.${TextureTypes}`;


/** supported material filetypes, wavefront mtl with pbr extensions */
const materialTypes = ["mtl"] as const;
type MaterialTypes = typeof materialTypes[number];

/** path relative to public/meshes/ */
export type MaterialPath = `${string}.${MaterialTypes}`;


/** supported font descriptor filetypes, bmfont compatible text file */
const fontTypes = ["fnt"] as const;
type FontTypes = typeof fontTypes[number];

/** path relative to public/fonts/ */
export type FontPath = `${string}.${FontTypes}`;


export type Shader = {
	readonly path: ShaderPath;
	/** shader code */
	code: string;
};

export type Mesh = {
	readonly path: MeshPath;
	/** packed f32 array with length size\*stride, triangulated vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz) */
	data: Float32Array;
	/** number of vertices */
	size: number;
	/** floats per vertex */
	stride: number;
};

export type Texture = {
	readonly path: TexturePath;
	/** packed u8 array with length width\*height\*4 */
	data: Uint8ClampedArray;
	width: number;
	height: number;
};

export type Collider = {
	readonly path: MeshPath;
	/** bounding box (local space) */
	bbox: Bbox;
	/** array of triangle vertices (local space) */
	triangles: [Vec3, Vec3, Vec3][];
	/** number of triangles */
	size: number;
};

/** map of mtl map label to concrete texture path */
export type Material = {
	readonly path: MaterialPath;
	diffuse_map?: TexturePath;
	normal_map?: TexturePath;
	roughness_map?: TexturePath;
	specular_map?: TexturePath;
};

/** 
 * bmf font descriptor, used to generate text quads. image data held in separate texture atlas
 * https://www.angelcode.com/products/bmfont/doc/file_format.html
 */
export type Font = {
	readonly path: FontPath;
	resolution: Vec2;
	line_height: number;
	base: number;
	chars: {
		id: number;
		pos: Vec2;
		size: Vec2;
		offset: Vec2;
		advance: number;
	}[],
	/** first, second, amount */
	kernings: {
		first: number,
		second: number,
		amount: number,	
	}[];
};


/** floats per vertex */
export const MESH_STRIDE = 15;

/** vertex layout helper */
export class Vertex {
	pos: Vec3 = new Vec3();
	normal: Vec3 = new Vec3(0, 0, 1);
	color: Vec4 = Vec4.splat(1);
	uv: Vec2 = new Vec2();
	tangent: Vec3 = new Vec3(1, 0, 0);

	constructor(data?: number[]) {
		if (data) {
			if (data.length != MESH_STRIDE) {
				throw new Error("invalid vertex data");
			}

			this.pos = new Vec3(...data.slice(0, 3));
			this.normal = new Vec3(...data.slice(3, 6));
			this.color = new Vec4(...data.slice(6, 10));
			this.uv = new Vec2(...data.slice(10, 12));
			this.tangent = new Vec3(...data.slice(12, 15));
		}
	}

	flatten(): number[] {
		return [
			this.pos.data,
			this.normal.data,
			this.color.data,
			this.uv.data,
			this.tangent.data,
		].flat()
	}
};

/** loads, processes and caches assets */
export class Assets {
	private shaders: Map<ShaderPath, Shader> = new Map();
	private meshes: Map<MeshPath, Mesh> = new Map();
	private textures: Map<TexturePath, Texture> = new Map();
	private colliders: Map<MeshPath, Collider> = new Map();
	private bboxes: Map<MeshPath, Bbox> = new Map();
	private materials: Map<MaterialPath, Material> = new Map();
	private fonts: Map<FontPath, Font> = new Map();


	/** load .wgsl shader from public/shaders/ */
	async loadShader(path: ShaderPath): Promise<Shader> {
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
		let code = await this.preprocessShader(`/shaders/${path}`, file);
		
		let shader: Shader = {
			path,
			code: code,
		};
		this.shaders.set(path, shader);
		return shader;
	}

	/** load .obj or .json mesh from public/meshes/ */
	async loadMesh(path: MeshPath): Promise<Mesh> {
		if (this.meshes.has(path)) {
			return this.meshes.get(path)!;
		}

		if (path.startsWith(":")) {
			throw new Error(`uninitialized dynamic mesh label: ${path}`);
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
				let mesh = parseMeshOBJ(path, file);
				this.meshes.set(path, mesh);
				return mesh;
			}
			case "json": {
				let file = await this.fetchFile(`/meshes/${path}`);
				let mesh = parseMeshJSON(path, file);
				this.meshes.set(path, mesh);
				return mesh;
			}
		}
	}

	/** load .png, .jpg or .json texture from public/textures/ */
	async loadTexture(path: TexturePath): Promise<Texture> {
		if (this.textures.has(path)) {
			return this.textures.get(path)!;
		}

		if (path.startsWith(":")) {
			throw new Error(`uninitialized dynamic texture label: ${path}`);
		}
		if (path.startsWith("$")) {
			throw new Error(`unintercepted builtin texture label: ${path}`);
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
					let texture = await parseTexturePNGJPG(path, file);
					this.textures.set(path, texture);
					return texture;

				} catch (e) {
					throw new Error(`invalid texture data: ${path}`);
				}
			}
			case "json": {
				let file = await this.fetchFile(`/textures/${path}`);
				let texture = parseTextureJSON(path, file);
				this.textures.set(path, texture);
				return texture;
			}
		}
	}

	/** generate collider based on .obj or .json mesh from public/meshes/ */
	async loadCollider(path: MeshPath): Promise<Collider> {
		if (this.colliders.has(path)) {
			return this.colliders.get(path)!;
		}
		
		let mesh = await this.loadMesh(path);
		let collider = parseCollider(path, mesh.data);

		this.colliders.set(path, collider);
		return collider;
	}

	/** returns new bbox based on .obj or .json mesh */
	async loadBbox(path: MeshPath): Promise<Bbox> {
		if (this.bboxes.has(path)) {
			return this.bboxes.get(path)!;
		}

		let mesh = await this.loadMesh(path);
		let bbox = parseBbox(mesh.data);
		this.bboxes.set(path, bbox);
		return bbox;
	}

	/** returns map of texture labels to texture paths defined in .mtl */
	async loadMaterial(path: MaterialPath): Promise<Material> {
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
		let material = parseMaterialMTL(path, file);
		this.materials.set(path, material);
		return material;
	}

	/** returns font offsets */
	async loadFont(path: FontPath): Promise<Font> {
		if (this.fonts.has(path)) {
			return this.fonts.get(path)!;
		}

		const type = (path.split(".").pop() || "") as FontTypes;
		if (!fontTypes.includes(type)) {
			throw new Error(`unknown font type: ${path}`);
		}

		if (!await this.fileExists(`/fonts/${path}`)) {
			throw new Error(`font does not exist: ${path}`);
		}

		let file = await this.fetchFile(`/fonts/${path}`);
		let font = parseFontFNT(path, file);
		this.fonts.set(path, font);
		return font;
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

	/** resolve #import in shaders relative to its path */
	private async preprocessShader(path: ShaderPath, file: string): Promise<string> {
		let out = "";
		for (let line of file.split(/\r?\n/)) {
			if (line.startsWith("#import ")) {
				let currentPath = path.split("/").slice(0, -1).join("/").replace("/shaders/", "") + "/";
				let relPath = line.replace(/#import\s+/, "").replace(/"/g, "");
				let absPath = currentPath + relPath;
				line = await this.loadShader(absPath as ShaderPath).then(s => s.code);
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

	/** returns number of assets in cache */
	size(): number {
		return [
			...this.shaders.values(),
			...this.meshes.values(),
			...this.textures.values(),
			...this.colliders.values(),
			...this.materials.values()
		].length;
	}
}
