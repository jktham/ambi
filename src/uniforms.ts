import { lerp, rnd } from "./utils";
import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

/** uniform data, underscore prefixed values are excluded from gui, otherwise name matches shader */
export class Uniforms {
	_name = "Uniforms";
	_useStorageBuffer = false; // set GPUBufferUsage.STORAGE flag, for large or dynamic buffers
	_instanceCount = 0; // draw instanced if > 0
	_useShadowMap = false; // include shadow depth buffer in bindgroup
	_data = new Float32Array(this._size()); // sent to shader each frame
	
	_size(): number {
		return 0; // * 4 bytes
	}

	_update(): Float32Array {
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
	shadow_view = new Mat4();
	shadow_projection = new Mat4();

	_size(): number {
		return 76;
	}

	_update(): Float32Array {
		this._data[0] = this.time;
		this._data[1] = this.frame;
		this._data[2] = this.fov;
		this._data.subarray(4, 4+2).set(this.resolution.data);
		this._data.subarray(8, 8+3).set(this.view_pos.data);
		this._data.subarray(12, 12+16).set(this.view.transpose().data);
		this._data.subarray(28, 28+16).set(this.view.inverse().transpose().data);
		this._data.subarray(44, 44+16).set(this.projection.transpose().data);
		this._data.subarray(60, 60+16).set(this.shadow_projection.mul(this.shadow_view).transpose().data);
		return this._data;
	}
}

export class ObjectUniforms extends Uniforms {
	_name = "ObjectUniforms";

	mask = 0;
	cull = 0.0;
	id = 0;
	uv_scale = 1.0;
	color = new Vec4();
	vert_config = new Vec4();
	frag_config = new Vec4();
	model = new Mat4();
	normal = new Mat4();

	_size(): number {
		return 48;
	}

	_update(): Float32Array {
		this._data[0] = this.mask;
		this._data[1] = this.cull;
		this._data[2] = this.id;
		this._data[3] = this.uv_scale;
		this._data.subarray(4, 4+4).set(this.color.data);
		this._data.subarray(8, 8+4).set(this.vert_config.data);
		this._data.subarray(12, 12+4).set(this.frag_config.data);
		this._data.subarray(16, 16+16).set(this.model.transpose().data);
		this._data.subarray(32, 32+16).set(this.normal.transpose().data);
		return this._data;
	}
}

type PhongMaterial = {
	ambient: Vec3,
	diffuse: Vec3,
	specular: Vec3,
	shininess: number,
};

type PointLight = {
	pos: Vec3,
	diffuse: Vec3,
	specular: Vec3,
	falloff_constant: number, // falloff = 1.0 / (c + l*d + e*d^2), c should be >= 1 to avoid singularities
	falloff_linear: number,
	falloff_exponential: number,
};

export class PhongUniforms extends Uniforms {
	_name = "PhongUniforms";

	material: PhongMaterial = {
		ambient: Vec3.splat(0.1),
		diffuse: Vec3.splat(0.6),
		specular: Vec3.splat(0.3),
		shininess: 32.0,
	};

	light: PointLight = {
		pos: new Vec3(),
		diffuse: Vec3.splat(1.0),
		specular: Vec3.splat(1.0),
		falloff_constant: 1.0,
		falloff_linear: 0.0,
		falloff_exponential: 0.0,
	};

	_size(): number {
		return 28;
	}

	_update(): Float32Array {
		this._data.subarray(0, 0+3).set(this.material.ambient.data);
		this._data.subarray(4, 4+3).set(this.material.diffuse.data);
		this._data.subarray(8, 8+3).set(this.material.specular.data);
		this._data[11] = this.material.shininess;
		this._data.subarray(12, 12+3).set(this.light.pos.data);
		this._data.subarray(16, 16+3).set(this.light.diffuse.data);
		this._data.subarray(20, 20+3).set(this.light.specular.data);
		this._data[23] = this.light.falloff_constant;
		this._data[24] = this.light.falloff_linear;
		this._data[25] = this.light.falloff_exponential;
		return this._data;
	}
}

export class InstancedUniforms extends Uniforms {
	_name = "InstancedUniforms";
	_useStorageBuffer = true;
	_instanceCount = 0;

	models: Mat4[] = [];
	normals: Mat4[] = [];

	_size(): number {
		return 4 + 32*this._instanceCount;
	}

	_update(): Float32Array {
		if (this._data.length != this._size()) {
			this._data = new Float32Array(this._size());
		}
		this._data[0] = this._instanceCount;
		for (let i=0; i<this._instanceCount; i++) {
			this._data.subarray(4 + i*32, 4 + (i+1)*32 + 16).set(this.models[i].transpose().data);
			this._data.subarray(4 + 16 + i*32, 4 + 16 + (i+1)*32 + 16).set(this.normals[i].transpose().data);
		}
		return this._data;
	}
}

type RaySphere = {
	/** w is radius */
	pos: Vec4,
	color: Vec4,
};

export class RayspheresUniforms extends Uniforms {
	_name = "RayspheresUniforms";
	_useStorageBuffer = true;
	
	material: PhongMaterial = {
		ambient: Vec3.splat(0.1),
		diffuse: Vec3.splat(0.6),
		specular: Vec3.splat(0.3),
		shininess: 32.0,
	};

	light: PointLight = {
		pos: new Vec3(),
		diffuse: Vec3.splat(1.0),
		specular: Vec3.splat(1.0),
		falloff_constant: 1.0,
		falloff_linear: 0.0,
		falloff_exponential: 0.0,
	};
	
	sphere_count = 0;
	relative_pos = 1; // 1: sphere pos relative to model, 0: sphere pos absolute
	background_color = new Vec4(0.0, 0.0, 0.0, 0.0);
	spheres: RaySphere[] = [];

	_size(): number {
		return 36 + 8*this.sphere_count;
	}

	_update(): Float32Array {
		if (this._data.length != this._size()) {
			this._data = new Float32Array(this._size());
		}
		this._data.subarray(0, 0+3).set(this.material.ambient.data);
		this._data.subarray(4, 4+3).set(this.material.diffuse.data);
		this._data.subarray(8, 8+3).set(this.material.specular.data);
		this._data[11] = this.material.shininess;
		this._data.subarray(12, 12+3).set(this.light.pos.data);
		this._data.subarray(16, 16+3).set(this.light.diffuse.data);
		this._data.subarray(20, 20+3).set(this.light.specular.data);
		this._data[23] = this.light.falloff_constant;
		this._data[24] = this.light.falloff_linear;
		this._data[25] = this.light.falloff_exponential;
		this._data[28] = this.sphere_count;
		this._data[29] = this.relative_pos;
		this._data.subarray(32, 32+4).set(this.background_color.data);
		for (let i=0; i<this.sphere_count; i++) {
			this._data.subarray(36 + i*8, 36 + (i+1)*8).set(this.spheres[i].pos.data);
			this._data.subarray(36 + 4 + i*8, 36 + 4 + (i+1)*8).set(this.spheres[i].color.data);
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

	_size(): number {
		return 40;
	}

	_update(): Float32Array {
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

	_size(): number {
		return 8;
	}

	_update(): Float32Array {
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

	_size(): number {
		return 96;
	}

	_update(): Float32Array {
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

	_size(): number {
		return 16*4 + 16*4 + 16;
	}

	_update(): Float32Array {
		this._data.subarray(0, 16*4).set(this.pulse_origins.map(o => [...o.data, 0.0]).flat());
		this._data.subarray(16*4, 16*4 + 16*4).set(this.pulse_colors.map(c => c.data).flat());
		this._data.subarray(16*4 + 16*4, 16*4 + 16*4 + 16).set(this.pulse_times);
		return this._data;
	}
}

export class PostSsaoUniforms extends Uniforms {
	_name = "PostSsaoUniforms";
	_useStorageBuffer = true; // vec3f array alignment

	kernel = new Array<Vec3>(64).fill(new Vec3()).map((_, i) => {
		let v = new Vec3(
			rnd(-1, 1),
			rnd(-1, 1),
			rnd(0, 1)
		).normalize();

		let scale = i / 64;
		scale = lerp(0.1, 1.0, scale*scale);
		v = v.mul(scale);
		return v;
	});
	samples = 8;
	radius = 1.0;
	noise = true;

	_size(): number {
		return 64*4 + 4; // vec4f array alignment
	}

	_update(): Float32Array {
		this._data.subarray(0, 64*4).set(this.kernel.map(v => [...v.data, 0.0]).flat());
		this._data[64*4] = this.samples;
		this._data[64*4 + 1] = this.radius;
		this._data[64*4 + 2] = this.noise ? 1.0 : 0.0;
		return this._data;
	}
}

export class PostDitherUniforms extends Uniforms {
	_name = "PostDitherUniforms";

	res = 64;
	scale = 1;
	strength = 0.92;
	threshold = 0.5;
	frames = 3;
	speed = 10.0;

	_size(): number {
		return 6;
	}

	_update(): Float32Array {
		this._data[0] = this.res;
		this._data[1] = this.scale;
		this._data[2] = this.strength;
		this._data[3] = this.threshold;
		this._data[4] = this.frames;
		this._data[5] = this.speed;
		return this._data;
	}
}

export class PostAsciiUniforms extends Uniforms {
	_name = "PostAsciiUniforms";

	size = 7;
	scale = 4;
	samples = 4;
	stages = 8;

	_size(): number {
		return 4;
	}

	_update(): Float32Array {
		this._data[0] = this.size;
		this._data[1] = this.scale;
		this._data[2] = this.samples;
		this._data[3] = this.stages;
		return this._data;
	}
}
