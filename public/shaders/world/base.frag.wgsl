struct FragmentIn {
	@builtin(position) screen: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct FragmentOut {
	@location(0) color: vec4f,
	@location(1) posDepth: vec4f,
	@location(2) normalMask: vec4f
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
	frame: i32,
	color: vec4f,
	viewPos: vec3f,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
	normal: mat4x4f
}

@group(0) @binding(0) var<uniform> baseUniforms: BaseUniforms;

@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	data.color = in.color * textureSample(texture, textureSampler, in.uv);
	data.pos = in.pos;
	data.depth = length(baseUniforms.viewPos - in.pos);
	data.normal = in.normal;
	data.mask = 0;
	return encodeFbData(data);
}

fn encodeFbData(data: FbData) -> FragmentOut {
	var out: FragmentOut;
	out.color = data.color;
	out.posDepth = vec4f(data.pos, data.depth);
	out.normalMask = vec4f((data.normal + 1.0) / 2.0, f32(data.mask) / 255.0);
	return out;
}
