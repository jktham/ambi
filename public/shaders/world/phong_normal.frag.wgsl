#import "../data.wgsl"
#import "../lighting.wgsl"

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
@group(1) @binding(2) var t_normal: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let normalmap = normalize(textureSample(t_normal, t_sampler, in.uv).xyz * 2.0 - 1.0); // [-1, 1]
	let normal = normalmap;

	var data: FbData;
	data.color = phong(in.color, in.pos, normal, u_global.view_pos, u_phong.ambient_factor, u_phong.diffuse_factor, u_phong.specular_factor, u_phong.specular_exponent, u_phong.light_pos, u_phong.light_color) * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
