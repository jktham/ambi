import { lerp, rnd } from "./utils";
import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class Uniforms {
	_name = "Uniforms";
	_useStorageBuffer = false; // set GPUBufferUsage.STORAGE flag, for large or dynamic buffers
	_instanceCount = 0; // draw instanced if > 0
	_data = new Float32Array(this.size());
	
	size(): number {
		return 0; // * 4 bytes
	}

	toArray(): Float32Array {
		return this._data;
	}
}

export class GlobalUniforms extends Uniforms {
	_name = "GlobalUniforms";

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
		this._data[0] = this.time;
		this._data[1] = this.frame;
		this._data[2] = this.fov;
		this._data.subarray(4, 4+2).set(this.resolution.data);
		this._data.subarray(8, 8+3).set(this.view_pos.data);
		this._data.subarray(12, 12+16).set(this.view.transpose().data);
		this._data.subarray(28, 28+16).set(this.view.inverse().transpose().data);
		this._data.subarray(44, 44+16).set(this.projection.transpose().data);
		return this._data;
	}
}

export class ObjectUniforms extends Uniforms {
	_name = "ObjectUniforms";

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
		this._data[0] = this.mask;
		this._data[1] = this.cull;
		this._data[2] = this.id;
		this._data.subarray(4, 4+4).set(this.color.data);
		this._data.subarray(8, 8+4).set(this.vert_config.data);
		this._data.subarray(12, 12+4).set(this.frag_config.data);
		this._data.subarray(16, 16+16).set(this.model.transpose().data);
		this._data.subarray(32, 32+16).set(this.normal.transpose().data);
		return this._data;
	}
}

export class PhongUniforms extends Uniforms {
	_name = "PhongUniforms";

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
		this._data[0] = this.ambient_factor;
		this._data[1] = this.diffuse_factor;
		this._data[2] = this.specular_factor;
		this._data[3] = this.specular_exponent;
		this._data.subarray(4, 4+3).set(this.light_pos.data);
		this._data.subarray(8, 8+4).set(this.light_color.data);
		return this._data;
	}
}

export class InstancedUniforms extends Uniforms {
	_name = "InstancedUniforms";
	_useStorageBuffer = true;
	_instanceCount = 0;

	models: Mat4[] = [];
	normals: Mat4[] = [];

	size(): number {
		return 4 + 32*this._instanceCount;
	}

	toArray(): Float32Array {
		if (this._data.length != this.size()) {
			this._data = new Float32Array(this.size());
		}
		this._data[0] = this._instanceCount;
		for (let i=0; i<this._instanceCount; i++) {
			this._data.subarray(4 + i*32, 4 + (i+1)*32 + 16).set(this.models[i].transpose().data);
			this._data.subarray(4 + 16 + i*32, 4 + 16 + (i+1)*32 + 16).set(this.normals[i].transpose().data);
		}
		return this._data;
	}
}

export class RayspheresUniforms extends Uniforms {
	_name = "RayspheresUniforms";
	_useStorageBuffer = true;
	
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
		if (this._data.length != this.size()) {
			this._data = new Float32Array(this.size());
		}
		this._data[0] = this.ambient_factor;
		this._data[1] = this.diffuse_factor;
		this._data[2] = this.specular_factor;
		this._data[3] = this.specular_exponent;
		this._data.subarray(4, 4+3).set(this.light_pos.data);
		this._data.subarray(8, 8+4).set(this.light_color.data);
		this._data[12] = this.sphere_count;
		this._data.subarray(16, 16+4).set(this.background_color.data);
		for (let i=0; i<this.sphere_count; i++) {
			this._data.subarray(20 + i*8, 20 + (i+1)*8).set(this.sphere_pos[i].data);
			this._data.subarray(20 + 4 + i*8, 20 + 4 + (i+1)*8).set(this.sphere_color[i].data);
		}
		return this._data;
	}
}

export class PostUniforms extends Uniforms {
	_name = "PostUniforms";

	time = 0;
	frame = 0;
	resolution = new Vec2();
	post_config = new Vec4();
	view = new Mat4();
	projection = new Mat4();

	size(): number {
		return 40;
	}

	toArray(): Float32Array {
		this._data[0] = this.time;
		this._data[1] = this.frame;
		this._data.subarray(2, 2+2).set(this.resolution.data);
		this._data.subarray(4, 4+4).set(this.post_config.data);
		this._data.subarray(8, 8+16).set(this.view.transpose().data);
		this._data.subarray(24, 24+16).set(this.projection.transpose().data);
		return this._data;
	}
}

export class PostPsxUniforms extends Uniforms {
	_name = "PostPsxUniforms";

	fog_start = 0.0;
	fog_end = 10.0;
	fog_color = new Vec4(0.6, 0.6, 0.6, 1.0);

	size(): number {
		return 8;
	}

	toArray(): Float32Array {
		this._data[0] = this.fog_start;
		this._data[1] = this.fog_end;
		this._data.subarray(4, 4+4).set(this.fog_color.data);
		return this._data;
	}
}

export class PostOutlineUniforms extends Uniforms {
	_name = "PostOutlineUniforms";
	_useStorageBuffer = true;

	scale = new Array<number>(16).fill(1);
	mode = [1].concat(new Array<number>(16-1).fill(0)); // 0 = outline only, 1 = self edges
	color = new Array<Vec4>(16).fill(new Vec4()).map(_ => new Vec4(1, 1, 1, 1));

	size(): number {
		return 96;
	}

	toArray(): Float32Array {
		this._data.subarray(0, 16).set(this.scale);
		this._data.subarray(16, 32).set(this.mode);
		this._data.subarray(32, 96).set(this.color.map(c => c.data).flat());
		return this._data;
	}
}

export class PostEchoUniforms extends Uniforms {
	_name = "PostEchoUniforms";
	_useStorageBuffer = true; // vec4f array alignment

	pulse_origins = new Array<Vec3>(16).fill(new Vec3());
	pulse_colors = new Array<Vec4>(16).fill(new Vec4(1, 1, 1, 1));
	pulse_times = new Array<number>(16).fill(0);

	size(): number {
		return 16*4 + 16*4 + 16;
	}

	toArray(): Float32Array {
		this._data.subarray(0, 16*4).set(this.pulse_origins.map(o => [...o.data, 0.0]).flat());
		this._data.subarray(16*4, 16*4 + 16*4).set(this.pulse_colors.map(c => c.data).flat());
		this._data.subarray(16*4 + 16*4, 16*4 + 16*4 + 16).set(this.pulse_times);
		return this._data;
	}
}

export class PostSsaoUniforms extends Uniforms {
	_name = "PostSsaoUniforms";
	_useStorageBuffer = true; // vec3f array alignment

	kernel = new Array<Vec3>(16).fill(new Vec3()).map((_, i) => {
		let v = new Vec3(
			rnd(-1, 1),
			rnd(-1, 1),
			rnd(0, 1)
		).normalize();

		let scale = i / 16;
		scale = lerp(0.1, 1.0, scale*scale);
		v = v.mul(scale);
		return v;
	});
	samples = 8;
	radius = 1.0;
	noise = true;

	size(): number {
		return 68;
	}

	toArray(): Float32Array {
		this._data.subarray(0, 16*4).set(this.kernel.map(v => [...v.data, 0.0]).flat());
		this._data[64] = this.samples;
		this._data[65] = this.radius;
		this._data[66] = this.noise ? 1.0 : 0.0;
		return this._data;
	}
}
