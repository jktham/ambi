struct FragmentIn {
	@builtin(position) screen: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f,
	@location(4) w: f32
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

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	data.color = (in.color / in.w) * textureSample(t_color, t_sampler, vec2f(vec2u((in.uv / in.w) * 255.0)) / 255.0);
	data.pos = in.pos;
	data.depth = length(u_base.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_base.mask);

	return encodeFbData(data);
}

fn encodeFbData(data: FbData) -> FragmentOut {
	var out: FragmentOut;
	out.color = data.color;
	out.pos_depth = vec4f(data.pos, data.depth);
	out.normal_mask = vec4f((data.normal + 1.0) / 2.0, f32(data.mask) / 255.0);
	return out;
}
