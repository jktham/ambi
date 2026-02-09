#import "../shared.wgsl"

struct PhongUniforms {
	ambient_factor: f32,
	diffuse_factor: f32,
	specular_factor: f32,
	specular_exponent: f32,
	light_pos: vec3f,
	light_color: vec4f,
}

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;
@group(0) @binding(3) var<uniform> u_phong: PhongUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	data.color = phong(in.color, in.pos, in.normal, u_phong.ambient_factor, u_phong.diffuse_factor, u_phong.specular_factor, u_phong.specular_exponent, u_phong.light_pos, u_phong.light_color, u_global.view_pos) * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, u_object.cull, in.pos, in.normal, u_global.view_pos);
	return encodeFbData(data);
}

fn phong(color: vec4f, pos: vec3f, normal: vec3f, ambient_factor: f32, diffuse_factor: f32, specular_factor: f32, specular_exponent: f32, light_pos: vec3f, light_color: vec4f, view_pos: vec3f) -> vec4f {
	let norm = normalize(normal);
	let light_dir = normalize(light_pos - pos);
	let view_dir = normalize(view_pos - pos);
	let reflect_dir = reflect(-light_dir, norm);

	let ambient = ambient_factor;
	let diffuse = diffuse_factor * max(dot(norm, light_dir), 0.0);
	let specular = specular_factor * pow(max(dot(view_dir, reflect_dir), 0.0), specular_exponent);

	return color * vec4f(light_color.rgb * (ambient + diffuse + specular), 1.0);
}
