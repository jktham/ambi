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
	color: vec4f,
	view_pos: vec3f,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
	normal: mat4x4f
}

struct PhongUniforms {
	ambient_factor: f32,
	diffuse_factor: f32,
	specular_factor: f32,
	specular_exponent: f32,
	light_pos: vec3f,
	light_color: vec4f,
}

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;
@group(0) @binding(2) var<uniform> u_phong: PhongUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	data.color = phong(in) * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_base.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_base.mask);
	return encodeFbData(data);
}

fn phong(in: FragmentIn) -> vec4f {
	let norm = normalize(in.normal);
	let light_dir = normalize(u_phong.light_pos - in.pos);
	let view_dir = normalize(u_base.view_pos - in.pos);
	let reflect_dir = reflect(-light_dir, norm);

	let ambient = u_phong.ambient_factor;
	let diffuse = u_phong.diffuse_factor * max(dot(norm, light_dir), 0.0);
	let specular = u_phong.specular_factor * pow(max(dot(view_dir, reflect_dir), 0.0), u_phong.specular_exponent);

	return in.color * u_phong.light_color * (ambient + diffuse + specular);
}

fn encodeFbData(data: FbData) -> FragmentOut {
	var out: FragmentOut;
	out.color = data.color;
	out.pos_depth = vec4f(data.pos, data.depth);
	out.normal_mask = vec4f((data.normal + 1.0) / 2.0, f32(data.mask) / 255.0);
	return out;
}
