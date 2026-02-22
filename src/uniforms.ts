import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class Uniforms {
	name = "Uniforms";
	useStorageBuffer = false; // set GPUBufferUsage.STORAGE flag, for large or dynamic buffers
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
	view_pos = new Vec3();
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
		this.data.subarray(8, 8+3).set(this.view_pos.data);
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
	vert_config = new Vec4();
	frag_config = new Vec4();
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
		this.data.subarray(8, 8+4).set(this.vert_config.data);
		this.data.subarray(12, 12+4).set(this.frag_config.data);
		this.data.subarray(16, 16+16).set(this.model.transpose().data);
		this.data.subarray(32, 32+16).set(this.normal.transpose().data);
		return this.data;
	}
}

export class PhongUniforms extends Uniforms {
	name = "PhongUniforms";

	ambient_factor = 0.1;
	diffuse_factor = 0.6;
	specular_factor = 0.3;
	specular_exponent = 32.0;
	light_pos = new Vec3();
	light_color = new Vec4(1.0, 1.0, 1.0, 1.0);

	size(): number {
		return 12;
	}

	toArray(): Float32Array {
		this.data[0] = this.ambient_factor;
		this.data[1] = this.diffuse_factor;
		this.data[2] = this.specular_factor;
		this.data[3] = this.specular_exponent;
		this.data.subarray(4, 4+3).set(this.light_pos.data);
		this.data.subarray(8, 8+4).set(this.light_color.data);
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
	
	ambient_factor = 0.1;
	diffuse_factor = 0.6;
	specular_factor = 0.3;
	specular_exponent = 32.0;
	light_pos = new Vec3();
	light_color = new Vec4(1.0, 1.0, 1.0, 1.0);
	
	sphere_count = 0;
	background_color = new Vec4(0.0, 0.0, 0.0, 0.0);
	sphere_pos: Vec4[] = []; // xyz = center, w = radius
	sphere_color: Vec4[] = [];

	size(): number {
		return 20 + 8*this.sphere_count;
	}

	toArray(): Float32Array {
		if (this.data.length != this.size()) {
			this.data = new Float32Array(this.size());
		}
		this.data[0] = this.ambient_factor;
		this.data[1] = this.diffuse_factor;
		this.data[2] = this.specular_factor;
		this.data[3] = this.specular_exponent;
		this.data.subarray(4, 4+3).set(this.light_pos.data);
		this.data.subarray(8, 8+4).set(this.light_color.data);
		this.data[12] = this.sphere_count;
		this.data.subarray(16, 16+4).set(this.background_color.data);
		for (let i=0; i<this.sphere_count; i++) {
			this.data.subarray(20 + i*8, 20 + (i+1)*8).set(this.sphere_pos[i].data);
			this.data.subarray(20 + 4 + i*8, 20 + 4 + (i+1)*8).set(this.sphere_color[i].data);
		}
		return this.data;
	}
}

export class PostUniforms extends Uniforms {
	name = "PostUniforms";

	time = 0;
	frame = 0;
	resolution = new Vec2();
	post_config = new Vec4();

	size(): number {
		return 8;
	}

	toArray(): Float32Array {
		this.data[0] = this.time;
		this.data[1] = this.frame;
		this.data.subarray(2, 2+2).set(this.resolution.data);
		this.data.subarray(4, 4+4).set(this.post_config.data);
		return this.data;
	}
}

export class PostPS1Uniforms extends Uniforms {
	name = "PostPS1Uniforms";

	fog_start = 0.0;
	fog_end = 10.0;
	fog_color = new Vec4(0.6, 0.6, 0.6, 1.0);

	size(): number {
		return 8;
	}

	toArray(): Float32Array {
		this.data[0] = this.fog_start;
		this.data[1] = this.fog_end;
		this.data.subarray(4, 4+4).set(this.fog_color.data);
		return this.data;
	}
}

export class PostOutlineUniforms extends Uniforms {
	name = "PostOutlineUniforms";
	useStorageBuffer = true;

	scale = new Array<number>(16).fill(1);
	mode = [1].concat(new Array<number>(16-1).fill(0)); // 0 = outline only, 1 = self edges
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

export class PostEchoUniforms extends Uniforms {
	name = "PostEchoUniforms";
	useStorageBuffer = true; // vec4f array alignment

	pulse_origins = new Array<Vec3>(16).fill(new Vec3());
	pulse_colors = new Array<Vec4>(16).fill(new Vec4(1, 1, 1, 1));
	pulse_times = new Array<number>(16).fill(0);

	size(): number {
		return 16*4 + 16*4 + 16;
	}

	toArray(): Float32Array {
		this.data.subarray(0, 16*4).set(this.pulse_origins.map(o => [...o.data, 0.0]).flat());
		this.data.subarray(16*4, 16*4 + 16*4).set(this.pulse_colors.map(c => c.data).flat());
		this.data.subarray(16*4 + 16*4, 16*4 + 16*4 + 16).set(this.pulse_times);
		return this.data;
	}
}
