export class Resources {
	private shaders: Map<string, string> = new Map();
	private meshes: Map<string, Float32Array> = new Map();
	private textures: Map<string, ImageData> = new Map();

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
			let data = JSON.parse(file || "[]") as number[];
			let mesh = new Float32Array(data);
			this.meshes.set(name, mesh);
			return mesh;
		}
	}

	public async loadTexture(name: string): Promise<ImageData> {
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
}
