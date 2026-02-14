import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class Uniforms {
	name = "Uniforms";
	useStorageBuffer = false; // set GPUBufferUsage.STORAGE flag
	instanceCount = 0; // draw instanced if > 0
	data = new Float32Array(this.size());
	
	size(): number {
		return 0; // * 4 bytes
	}

	toArray(): Float32Array {
		return this.data;
	}
}

export class GlobalUniforms extends Uniforms {
	name = "GlobalUniforms";
	time = 0;
	frame = 0;
	fov = 0;
	resolution = new Vec2();
	viewPos = new Vec3();
	view = new Mat4();
	projection = new Mat4();

	size(): number {
		return 60;
	}

	toArray(): Float32Array {
		this.data[0] = this.time;
		this.data[1] = this.frame;
		this.data[2] = this.fov;
		this.data.subarray(4, 4+2).set(this.resolution.data);
		this.data.subarray(8, 8+3).set(this.viewPos.data);
		this.data.subarray(12, 12+16).set(this.view.transpose().data);
		this.data.subarray(28, 28+16).set(this.view.inverse().transpose().data);
		this.data.subarray(44, 44+16).set(this.projection.transpose().data);
		return this.data;
	}
}

export class ObjectUniforms extends Uniforms {
	name = "ObjectUniforms";
	mask = 0;
	cull = 0.0;
	id = 0;
	color = new Vec4();
	vertConfig = new Vec4();
	fragConfig = new Vec4();
	model = new Mat4();
	normal = new Mat4();

	size(): number {
		return 48;
	}

	toArray(): Float32Array {
		this.data[0] = this.mask;
		this.data[1] = this.cull;
		this.data[2] = this.id;
		this.data.subarray(4, 4+4).set(this.color.data);
		this.data.subarray(8, 8+4).set(this.vertConfig.data);
		this.data.subarray(12, 12+4).set(this.fragConfig.data);
		this.data.subarray(16, 16+16).set(this.model.transpose().data);
		this.data.subarray(32, 32+16).set(this.normal.transpose().data);
		return this.data;
	}
}

export class PhongUniforms extends Uniforms {
	name = "PhongUniforms";
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
		this.data[0] = this.ambientFactor;
		this.data[1] = this.diffuseFactor;
		this.data[2] = this.specularFactor;
		this.data[3] = this.specularExponent;
		this.data.subarray(4, 4+3).set(this.lightPos.data);
		this.data.subarray(8, 8+4).set(this.lightColor.data);
		return this.data;
	}
}

export class InstancedUniforms extends Uniforms {
	name = "InstancedUniforms";
	useStorageBuffer = true;
	instanceCount = 0;
	models: Mat4[] = [];
	normals: Mat4[] = [];

	size(): number {
		return 4 + 32*this.instanceCount;
	}

	toArray(): Float32Array {
		if (this.data.length != this.size()) {
			this.data = new Float32Array(this.size());
		}
		this.data[0] = this.instanceCount;
		for (let i=0; i<this.instanceCount; i++) {
			this.data.subarray(4 + i*32, 4 + (i+1)*32 + 16).set(this.models[i].transpose().data);
			this.data.subarray(4 + 16 + i*32, 4 + 16 + (i+1)*32 + 16).set(this.normals[i].transpose().data);
		}
		return this.data;
	}
}

export class RayspheresUniforms extends Uniforms {
	name = "RayspheresUniforms";
	useStorageBuffer = true;
	
	ambientFactor = 0.1;
	diffuseFactor = 0.6;
	specularFactor = 0.3;
	specularExponent = 32.0;
	lightPos = new Vec3();
	lightColor = new Vec4(1.0, 1.0, 1.0, 1.0);
	
	sphereCount = 0;
	backgroundColor = new Vec4(0.0, 0.0, 0.0, 0.0);
	spherePos: Vec4[] = []; // xyz = center, w = radius
	sphereColor: Vec4[] = [];

	size(): number {
		return 20 + 8*this.sphereCount;
	}

	toArray(): Float32Array {
		if (this.data.length != this.size()) {
			this.data = new Float32Array(this.size());
		}
		this.data[0] = this.ambientFactor;
		this.data[1] = this.diffuseFactor;
		this.data[2] = this.specularFactor;
		this.data[3] = this.specularExponent;
		this.data.subarray(4, 4+3).set(this.lightPos.data);
		this.data.subarray(8, 8+4).set(this.lightColor.data);
		this.data[12] = this.sphereCount;
		this.data.subarray(16, 16+4).set(this.backgroundColor.data);
		for (let i=0; i<this.sphereCount; i++) {
			this.data.subarray(20 + i*8, 20 + (i+1)*8).set(this.spherePos[i].data);
			this.data.subarray(20 + 4 + i*8, 20 + 4 + (i+1)*8).set(this.sphereColor[i].data);
		}
		return this.data;
	}
}

export class PostUniforms extends Uniforms {
	name = "PostUniforms";
	time = 0;
	frame = 0;
	resolution = new Vec2();

	size(): number {
		return 4;
	}

	toArray(): Float32Array {
		this.data[0] = this.time;
		this.data[1] = this.frame;
		this.data.subarray(2, 2+2).set(this.resolution.data);
		return this.data;
	}
}

export class PostPS1Uniforms extends Uniforms {
	name = "PostPS1Uniforms";
	fogStart = 0.0;
	fogEnd = 10.0;
	fogColor = new Vec4(0.6, 0.6, 0.6, 1.0);

	size(): number {
		return 8;
	}

	toArray(): Float32Array {
		this.data[0] = this.fogStart;
		this.data[1] = this.fogEnd;
		this.data.subarray(4, 4+4).set(this.fogColor.data);
		return this.data;
	}
}

export class PostOutlineUniforms extends Uniforms {
	name = "PostOutlineUniforms";
	useStorageBuffer = true;
	scale = new Array<number>(16).fill(1);
	mode = [1].concat(new Array<number>(16-1).fill(0));
	color = new Array<Vec4>(16).fill(new Vec4()).map(_ => new Vec4(1, 1, 1, 1));

	size(): number {
		return 96;
	}

	toArray(): Float32Array {
		this.data.subarray(0, 16).set(this.scale);
		this.data.subarray(16, 32).set(this.mode);
		this.data.subarray(32, 96).set(this.color.map(c => c.data).flat());
		return this.data;
	}
}