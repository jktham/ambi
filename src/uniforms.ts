import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class Uniforms {
	useStorageBuffer = false; // set GPUBufferUsage.STORAGE flag
	instanceCount = 0; // draw instanced if > 0
	
	size(): number {
		return 0; // * 4 bytes
	}

	toArray(): Float32Array {
		return new Float32Array(this.size());
	}
}

export class BaseUniforms extends Uniforms {
	time = 0;
	frame = 0;
	mask = 0;
	resolution = new Vec2();
	color = new Vec4();
	viewPos = new Vec3();
	model = new Mat4();
	view = new Mat4();
	projection = new Mat4();
	normal = new Mat4();

	size(): number {
		return 80;
	}

	toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data[0] = this.time;
		data[1] = this.frame;
		data[2] = this.mask;
		data.subarray(4, 4+2).set(this.resolution.data);
		data.subarray(8, 8+4).set(this.color.data);
		data.subarray(12, 12+3).set(this.viewPos.data);
		data.subarray(16, 16+16).set(this.model.transpose().data);
		data.subarray(32, 32+16).set(this.view.transpose().data);
		data.subarray(48, 48+16).set(this.projection.transpose().data);
		data.subarray(64, 64+16).set(this.normal.transpose().data);
		return data;
	}
}

export class PhongUniforms extends Uniforms {
	ambientFactor = 0.1;
	diffuseFactor = 0.6;
	specularFactor = 0.3;
	specularExponent = 32.0;
	lightPos = new Vec3();
	lightColor = new Vec4(1.0, 1.0, 1.0, 1.0);

	size(): number {
		return 12;
	}

	toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data[0] = this.ambientFactor;
		data[1] = this.diffuseFactor;
		data[2] = this.specularFactor;
		data[3] = this.specularExponent;
		data.subarray(4, 4+3).set(this.lightPos.data);
		data.subarray(8, 8+4).set(this.lightColor.data);
		return data;
	}
}

export class InstancedUniforms extends Uniforms {
	useStorageBuffer = true;
	instanceCount = 0;
	models: Mat4[] = [];
	normals: Mat4[] = [];

	size(): number {
		return 4 + 32*this.instanceCount;
	}

	toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data[0] = this.instanceCount;
		for (let i=0; i<this.instanceCount; i++) {
			data.subarray(4 + i*32, 4 + (i+1)*32 + 16).set(this.models[i].transpose().data);
			data.subarray(4 + 16 + i*32, 4 + 16 + (i+1)*32 + 16).set(this.normals[i].transpose().data);
		}
		return data;
	}
}

export class PostBaseUniforms extends Uniforms {
	time = 0;
	frame = 0;
	resolution = new Vec2();

	size(): number {
		return 4;
	}

	toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data[0] = this.time;
		data[1] = this.frame;
		data.subarray(2, 2+2).set(this.resolution.data);
		return data;
	}
}

export class PostPS1Uniforms extends Uniforms {
	fogStart = 0.0;
	fogEnd = 10.0;
	fogColor = new Vec4(0.6, 0.6, 0.6, 1.0);

	size(): number {
		return 8;
	}

	toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data[0] = this.fogStart;
		data[1] = this.fogEnd;
		data.subarray(4, 4+4).set(this.fogColor.data);
		return data;
	}
}

export class PostOutlineUniforms extends Uniforms {
	useStorageBuffer = true;
	scale = new Array<number>(16).fill(1);
	mode = [1].concat(new Array<number>(16-1).fill(0));
	color = new Array<Vec4>(16).fill(new Vec4()).map(_ => new Vec4(1, 1, 1, 1));

	size(): number {
		return 96;
	}

	toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data.subarray(0, 16).set(this.scale);
		data.subarray(16, 32).set(this.mode);
		data.subarray(32, 96).set(this.color.map(c => c.data).flat());
		return data;
	}
}