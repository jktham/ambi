import { Bbox } from "./bbox";
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


/** dynamic assets added to cache by scene.generateAssets, not loaded from a file */
export type DynamicAssetLabel = `:${string}`;

/** supported mesh filetypes */
const meshTypes = ["obj", "ply", "json"] as const;
type MeshTypes = typeof meshTypes[number];

/** path relative to public/meshes/ or dynamic label */
export type MeshPath = `${string}.${MeshTypes}` | DynamicAssetLabel;


/** supported texture filetypes */
const textureTypes = ["png", "jpg", "json"] as const;
type TextureTypes = typeof textureTypes[number];

/** special labels from mtl that are resolved before asset load */
export type MaterialTextureLabel = `@${"diffuse" | "normal" | "roughness" | "specular"}`;

/** special labels from renderer that are intercepted before asset load */
export type BuiltinTextureLabel = `$${"shadowmap" | "framebuffer" | `portal_${number}`}`;

/** path relative to public/textures/ or material/builtin/dynamic label */
export type TexturePath = `${string}.${TextureTypes}` | MaterialTextureLabel | BuiltinTextureLabel | DynamicAssetLabel;


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
	readonly code: string;
};

export type Mesh = {
	readonly path: MeshPath;
	/** packed f32 array with length size\*stride, triangulated vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz) */
	readonly data: Float32Array;
	/** number of vertices */
	readonly size: number;
	/** floats per vertex */
	readonly stride: number;
};

export type Texture = {
	readonly path: TexturePath;
	/** packed u8 array with length width\*height\*4 */
	readonly data: Uint8ClampedArray;
	readonly width: number;
	readonly height: number;
};

export type Collider = {
	readonly path: MeshPath;
	/** array of triangle vertices */
	readonly triangles: [Vec3, Vec3, Vec3][];
	/** number of triangles */
	readonly size: number;
};

/** map of mtl map label to concrete texture path */
export type Material = Map<MaterialTextureLabel, TexturePath>;

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


	addDynamicMesh(label: DynamicAssetLabel, data: Float32Array) {
		let mesh: Mesh = {
			path: label,
			data,
			size: data.length / MESH_STRIDE,
			stride: MESH_STRIDE,
		};
		this.meshes.set(label, mesh);
	}

	addDynamicTexture(label: DynamicAssetLabel, data: Uint8ClampedArray, width: number, height: number) {
		let texture: Texture = {
			path: label,
			data,
			width,
			height,
		};
		this.textures.set(label, texture);
	}

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
				let data = this.parseOBJ(path, file);

				let mesh: Mesh = {
					path,
					data,
					size: data.length / MESH_STRIDE,
					stride: MESH_STRIDE,
				};
				this.meshes.set(path, mesh);
				return mesh;
			}
			case "ply": {
				let file = await this.fetchFile(`/meshes/${path}`);
				let data = this.parseOBJ(path, file);

				let mesh: Mesh = {
					path,
					data,
					size: data.length / MESH_STRIDE,
					stride: MESH_STRIDE,
				};
				this.meshes.set(path, mesh);
				return mesh;
			}
			case "json": {
				let file = await this.fetchFile(`/meshes/${path}`);
				let data = new Float32Array(JSON.parse(file || "[]") as number[]); // should be flat list of vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz)

				let mesh: Mesh = {
					path,
					data,
					size: data.length / MESH_STRIDE,
					stride: MESH_STRIDE,
				};
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
		if (path.startsWith("@")) {
			throw new Error(`unresolved material texture label: ${path}`);
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
					let image = new Image();
					image.src = file;
					await image.decode();

					const [width, height] = [image.naturalWidth, image.naturalHeight];
					let canvas = new OffscreenCanvas(width, height);
					let context = canvas.getContext("2d")!;
					context.drawImage(image, 0, 0);
					let imageData = context.getImageData(0, 0, width, height);

					let texture: Texture = {
						path,
						data: imageData.data,
						width,
						height,
					};
					this.textures.set(path, texture);
					return texture;

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

				const height = data.length;
				const width = data[0].length;
				let imageData = new ImageData(new Uint8ClampedArray(data.flat(2)), width, height);

				let texture: Texture = {
					path,
					data: imageData.data,
					width,
					height,
				};
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
		let data = this.parseCollider(path, mesh.data);

		let collider: Collider = {
			path,
			triangles: data,
			size: data.length,
		};
		this.colliders.set(path, collider);
		return collider;
	}

	/** returns new bbox based on .obj or .json mesh, only populates min/max */
	async loadBbox(path: MeshPath): Promise<Bbox> {
		if (this.bboxes.has(path)) {
			return this.bboxes.get(path)!;
		}

		let mesh = await this.loadMesh(path);
		let bbox = this.parseBbox(path, mesh.data);
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
		let material = this.parseMTL(path, file);
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
		let font = this.parseFont(path, file);
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

	/** parses .obj file as string, returns flat f32 array of triangulates vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz) */
	private parseOBJ(path: MeshPath, file: string): Float32Array {
		let v: number[][] = []; // vertex pos xyz
		let vc: number[][] = []; // vertex color rgba
		let vn: number[][] = []; // vertex normal xyz
		let vt: number[][] = []; // vertex texcoord uv
		let faces: number[][][] = []; // faces, list of [v1, v2, v3]

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

					let vertex = new Vertex();
					vertex.pos = new Vec3(...v[iv-1]);
					vertex.normal = new Vec3(...vn[ivn-1]);
					vertex.color = new Vec4(...vc[ivc-1]);
					vertex.uv = ivt ? new Vec2(...vt[ivt-1]) : new Vec2(0, 0);
					vertex.tangent = new Vec3(0, 0, 0);

					face.push(vertex.flatten());
				} if (face.length == 3) {
					faces.push(face);
				} else if (face.length > 3) { // we assume convex
					for (let i=2; i<face.length; i++) { // triangulate ngons
						faces.push([face[0], face[i-1], face[i]]);
					}
				} else {
					console.warn(`invalid mesh face: ${path}, ${face}`);
				}
			}
		}

		// compute tangent as in https://learnopengl.com/Advanced-Lighting/Normal-Mapping
		for (let i = 0; i < faces.length; i++) {
			let v0 = new Vertex(faces[i][0]);
			let v1 = new Vertex(faces[i][1]);
			let v2 = new Vertex(faces[i][2]);

			let edge1 = v1.pos.sub(v0.pos);
			let edge2 = v2.pos.sub(v0.pos);
			let duv1 = v1.uv.sub(v0.uv);
			let duv2 = v2.uv.sub(v0.uv);

			let tangent = new Vec3();
			let fract = 1.0 / (duv1.x * duv2.y - duv2.x * duv1.y);

			tangent.x = fract * (duv2.y * edge1.x - duv1.y * edge2.x);
			tangent.y = fract * (duv2.y * edge1.y - duv1.y * edge2.y);
			tangent.z = fract * (duv2.y * edge1.z - duv1.y * edge2.z);
			tangent = tangent.normalize();

			v0.tangent = tangent;
			v1.tangent = tangent;
			v2.tangent = tangent;

			faces[i][0] = v0.flatten();
			faces[i][1] = v1.flatten();
			faces[i][2] = v2.flatten();
		}

		let mesh = faces.flat(2);
		return new Float32Array(mesh);
	}

	/** returns 2d list of vertex positions from full mesh array */
	private parseCollider(path: MeshPath, mesh: Float32Array): [Vec3, Vec3, Vec3][] {
		let collider: [Vec3, Vec3, Vec3][] = [];
		for (let i=0; i<mesh.length; i+=MESH_STRIDE*3) {
			let v0 = new Vertex([...mesh.slice(i, i + MESH_STRIDE)]);
			let v1 = new Vertex([...mesh.slice(i + MESH_STRIDE, i + 2*MESH_STRIDE)]);
			let v2 = new Vertex([...mesh.slice(i + 2*MESH_STRIDE, i + 3*MESH_STRIDE)]);
			collider.push([v0.pos, v1.pos, v2.pos]);
		}
		return collider;
	}

	/** returns min/max of vertex positions */
	private parseBbox(path: MeshPath, mesh: Float32Array): Bbox {
		let min = new Vec3(Infinity, Infinity, Infinity);
		let max = new Vec3(-Infinity, -Infinity, -Infinity);

		for (let i=0; i<mesh.length; i+=MESH_STRIDE) {
			let v = new Vertex([...mesh.slice(i, i+MESH_STRIDE)]).pos;
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
	private parseMTL(path: MaterialPath, file: string): Material {
		let maps = new Map<MaterialTextureLabel, TexturePath>();
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
				case "map_ns": {
					let abs = words[1];
					if (!abs.includes("textures/")) {
						console.warn(`roughness map texture path in mtl does not include "textures/": ${path}, ${abs}`);
						continue;
					}
					let rel = abs.split("textures/").slice(1).join("");
					maps.set("@roughness", rel as TexturePath);
					break;
				}
				case "map_ks": {
					let abs = words[1];
					if (!abs.includes("textures/")) {
						console.warn(`specular map texture path in mtl does not include "textures/": ${path}, ${abs}`);
						continue;
					}
					let rel = abs.split("textures/").slice(1).join("");
					maps.set("@specular", rel as TexturePath);
					break;
				}
			}
		}
		return maps;
	}

	/** parse font csv and return offsets */
	private parseFont(path: FontPath, file: string): Font {
		/** parses list of key=value strings and returns map */
		const parseKV = (pairs: string[]): Map<string, number> => {
			let map = new Map<string, number>();
			for (let pair of pairs) {
				let p = pair.split("=");
				map.set(p[0], parseFloat(p[1]));
			}
			return map;
		}

		let font: Font = {
			path,
			resolution: new Vec2(),
			line_height: 0,
			base: 0,
			chars: [],
			kernings: []
		};

		for (let line of file.split(/\r?\n/)) {
			let words = line.split(/\s+/).filter(w => w != "");
			let kv = parseKV(words.slice(1));
			
			if (words[0] == "common") {
				font.resolution.x = kv.get("scaleW")!;
				font.resolution.y = kv.get("scaleH")!;
				font.line_height = kv.get("lineHeight")!;
				font.base = kv.get("base")!;

			} else if (words[0] == "char") {
				let char = {
					id: kv.get("id")!,
					pos: new Vec2(kv.get("x")!, kv.get("y")!),
					size: new Vec2(kv.get("width")!, kv.get("height")!),
					offset: new Vec2(kv.get("xoffset")!, kv.get("yoffset")!),
					advance: kv.get("xadvance")!,
				};
				font.chars.push(char);

			} else if (words[0] == "kerning") {
				let kerning = {
					first: kv.get("first")!, 
					second: kv.get("second")!, 
					amount: kv.get("amount")!,
				};
				font.kernings.push(kerning);

			}
		}
		return font;
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

	/** generate quads per character with uv coords matching font atlas texture */
	async generateTextMesh(fontPath: FontPath, text: string, font_size: number = 1, align: "left" | "center" | "right" = "left"): Promise<Float32Array> {
		let font = await this.loadFont(fontPath);
		
		let cursor = new Vec2(0, -font.base);
		let scale = 1.0 / font.line_height * font_size;

		// generate quads
		let line = 0;
		let line_widths = [];
		let lines: [Vertex, Vertex, Vertex, Vertex][][] = [];
		for (let i=0; i<text.length; i++) {
			let c = text.charCodeAt(i);
			let next = text.charCodeAt(i+1);

			// line break
			if (c == 10) {
				cursor.x = 0;
				cursor.y -= font.line_height;
				line++;
				continue;
			}

			let char = font.chars.find(ch => ch.id == c);

			if (!char) {
				console.warn(`unknown char ${c}`);
				continue;
			}

			let top_left = new Vertex();
			let top_right = new Vertex();
			let bottom_left = new Vertex();
			let bottom_right = new Vertex();

			top_left.pos = new Vec3(cursor.x + char.offset.x, cursor.y + font.base - char.offset.y, 0);
			top_right.pos = top_left.pos.add(new Vec3(char.size.x, 0, 0));
			bottom_left.pos = top_left.pos.add(new Vec3(0, -char.size.y, 0));
			bottom_right.pos = top_left.pos.add(new Vec3(char.size.x, -char.size.y, 0));

			for (let v of [bottom_left, bottom_right, top_left, top_right]) {
				v.pos = v.pos.mul(scale);
			}

			top_left.uv = new Vec2(char.pos.x, char.pos.y);
			top_right.uv = top_left.uv.add(new Vec2(char.size.x, 0));
			bottom_left.uv = top_left.uv.add(new Vec2(0, char.size.y));
			bottom_right.uv = top_left.uv.add(new Vec2(char.size.x, char.size.y));

			for (let v of [bottom_left, bottom_right, top_left, top_right]) {
				v.uv = v.uv.div(font.resolution);
				v.uv.y = 1.0 - v.uv.y;
			}

			while (lines.length < line + 1) {
				lines.push([]);
			}
			lines[line].push([bottom_left, bottom_right, top_left, top_right]);

			if (next) {
				let kerning = font.kernings.find(k => k.first == c && k.second == next);
				if (kerning) {
					cursor.x += kerning.amount;
				}
			}
			cursor.x += char.advance;

			while (line_widths.length < line + 1) {
				line_widths.push(0);
			}
			line_widths[line] = cursor.x;
		}

		// adjust alignment
		for (let [i, line] of lines.entries()) {
			for (let quad of line) {
				for (let vert of quad) {
					if (align == "center") {
						vert.pos.x -= line_widths[i] / 2.0 * scale;
					} else if (align == "right") {
						vert.pos.x -= line_widths[i] * scale;
					}
				}
			}
		}

		// triangulate quads
		let verts: number[][] = [];
		for (let line of lines) {
			for (let [bottom_left, bottom_right, top_left, top_right] of line) {
				verts.push(bottom_left.flatten());
				verts.push(top_right.flatten());
				verts.push(top_left.flatten());
				
				verts.push(bottom_left.flatten());
				verts.push(bottom_right.flatten());
				verts.push(top_right.flatten());
			}
		}
		
		return new Float32Array(verts.flat());
	};

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
