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
}

struct FbData {
	color: vec4f,
	pos: vec3f,
	depth: f32,
	normal: vec3f,
	mask: u32,
}

struct BaseUniforms {
	time: f32,
	frame: f32,
	mask: f32,
	resolution: vec2f,
	color: vec4f,
	view_pos: vec3f,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
	normal: mat4x4f
}

struct PostBaseUniforms {
	time: f32,
	frame: f32,
	resolution: vec2f,
}

fn encodeFbData(data: FbData) -> FragmentOut {
	var out: FragmentOut;
	out.color = data.color;
	out.pos_depth = vec4f(data.pos, data.depth);
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
	data.depth = pd.w;
	data.normal = nm.xyz * 2.0 - 1.0;
	data.mask = u32(nm.w * 255.0);

	return data;
}
