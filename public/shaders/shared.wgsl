struct VertexIn {
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct VertexOut {
	@builtin(position) ndc: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct FragmentIn {
	@builtin(position) screen: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct FragmentOut {
	@location(0) color: vec4f,
	@location(1) pos_depth: vec4f,
	@location(2) normal_mask: vec4f
};

struct FbData {
	color: vec4f,
	pos: vec3f,
	depth: f32,
	normal: vec3f,
	mask: u32,
};

struct BaseUniforms {
	time: f32,
	frame: f32,
	mask: f32,
	cull: f32,
	resolution: vec2f,
	color: vec4f,
	view_pos: vec3f,
	id: u32,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
	normal: mat4x4f,
	vert_config: vec4f,
	frag_config: vec4f,
};

struct PostBaseUniforms {
	time: f32,
	frame: f32,
	resolution: vec2f,
};

fn decideDiscard(color: vec4f, cull: f32, pos: vec3f, normal: vec3f, view_pos: vec3f) {
	if (color.a == 0.0) {
		discard;
	}

	if (cull != 0.0) {
		let view_dir = normalize(view_pos - pos);
		let face = dot(normalize(normal), view_dir);
		if (face * cull < 0.0) {
			discard;
		}
	}
}

fn encodeFbData(data: FbData) -> FragmentOut {
	var out: FragmentOut;
	out.color = data.color;
	out.pos_depth = vec4f(data.pos, log2(data.depth + 1.0));
	out.normal_mask = vec4f((data.normal + 1.0) / 2.0, f32(data.mask) / 255.0);
	return out;
}

fn loadFbData(pixel: vec2u, fb_color: texture_storage_2d<rgba8unorm, read>, fb_pos_depth: texture_storage_2d<rgba32float, read>, fb_normal_mask: texture_storage_2d<rgba8unorm, read>) -> FbData {
	var data: FbData;
	let color = textureLoad(fb_color, pixel);
	let pd = textureLoad(fb_pos_depth, pixel);
	let nm = textureLoad(fb_normal_mask, pixel);

	data.color = color;
	data.pos = pd.xyz;
	data.depth = exp2(pd.w) - 1.0;
	data.normal = nm.xyz * 2.0 - 1.0;
	data.mask = u32(nm.w * 255.0);

	return data;
}

fn rnd(seed: f32) -> f32 {
	return fract(sin(seed) * 43758.5453123);
}

fn rndvec(seed: f32) -> vec3f {
	return vec3f(
		fract(sin(seed) * 43758.5453123),
		fract(sin(seed + 1.0) * 43758.5453123),
		fract(sin(seed + 2.0) * 43758.5453123)
	);
}
