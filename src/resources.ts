export class Resources {
	public shaders: Map<string, string> = new Map();
	public meshes: Map<string, Float32Array> = new Map();
	public textures: Map<string, Uint8Array> = new Map();

	public async loadShader(name: string): Promise<string> {
		let cached = this.shaders.get(name);
		if (cached) {
			return cached;
		} else {
			let file = await this.fetchFile(`/shaders/${name}`);
			this.shaders.set(name, file);
			return file;
		}
	}

	public async loadMesh(name: string): Promise<Float32Array> {
		let cached = this.meshes.get(name);
		if (cached) {
			return cached;
		} else {
			let file = await this.fetchFile(`/meshes/${name}`);
			let mesh = new Float32Array(JSON.parse(file));
			this.meshes.set(name, mesh);
			return mesh;
		}
	}

	public async loadTexture(name: string): Promise<Uint8Array> {
		let cached = this.textures.get(name);
		if (cached) {
			return cached;
		} else {
			let file = await this.fetchFile(`/textures/${name}`);
			let texture = new Uint8Array(JSON.parse(file).flat());
			this.textures.set(name, texture);
			return texture;
		}
	}

	private async fetchFile(path: string): Promise<string> {
		try {
			let res = await fetch(path).then(res => res.text());
			return res;
		} catch (e) {
			console.log(e);
			return "";
		}
	}
}
