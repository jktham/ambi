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

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	data.color = phong(in.color, in.pos, in.normal, u_global.view_pos, u_phong.ambient_factor, u_phong.diffuse_factor, u_phong.specular_factor, u_phong.specular_exponent, u_phong.light_pos, u_phong.light_color) * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	const q = 8.0;
	let quantized = floor(data.color * q) / q;
	data.color = vec4f(quantized.xyz, data.color.w);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
