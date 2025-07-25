import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class Uniforms {
	public useStorageBuffer = false;
	
	public size(): number {
		return 0;
	}

	public toArray(): Float32Array {
		return new Float32Array(this.size());
	}
}

export class BaseUniforms extends Uniforms {
	public time = 0;
	public frame = 0;
	public mask = 0;
	public resolution = new Vec2();
	public color = new Vec4();
	public viewPos = new Vec3();
	public model = new Mat4();
	public view = new Mat4();
	public projection = new Mat4();
	public normal = new Mat4();

	public size(): number {
		return 80;
	}

	public toArray(): Float32Array {
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
	public ambientFactor = 0.1;
	public diffuseFactor = 0.6;
	public specularFactor = 0.3;
	public specularExponent = 32.0;
	public lightPos = new Vec3();
	public lightColor = new Vec4(1.0, 1.0, 1.0, 1.0);

	public size(): number {
		return 12;
	}

	public toArray(): Float32Array {
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
	public useStorageBuffer = true;
	public instanceCount = 0;
	public models: Mat4[] = [];
	public normals: Mat4[] = [];

	public size(): number {
		return 4 + 32*this.instanceCount;
	}

	public toArray(): Float32Array {
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
	public time = 0;
	public frame = 0;
	public resolution = new Vec2();

	public size(): number {
		return 4;
	}

	public toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data[0] = this.time;
		data[1] = this.frame;
		data.subarray(2, 2+2).set(this.resolution.data);
		return data;
	}
}

export class PostPS1Uniforms extends Uniforms {
	public fogStart = 0.0;
	public fogEnd = 10.0;
	public fogColor = new Vec4(0.6, 0.6, 0.6, 1.0);

	public size(): number {
		return 8;
	}

	public toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data[0] = this.fogStart;
		data[1] = this.fogEnd;
		data.subarray(4, 4+4).set(this.fogColor.data);
		return data;
	}
}

export class PostOutlineUniforms extends Uniforms {
	public useStorageBuffer = true;
	public scale = new Array<number>(16).fill(1);
	public mode = new Array<number>(16).fill(0);
	public color = new Array<Vec4>(16).fill(new Vec4(1, 1, 1, 1));

	public size(): number {
		return 96;
	}

	public toArray(): Float32Array {
		let data = new Float32Array(this.size());
		data.subarray(0, 16).set(this.scale);
		data.subarray(16, 32).set(this.mode);
		data.subarray(32, 96).set(this.color.map(c => c.data).flat());
		return data;
	}
}