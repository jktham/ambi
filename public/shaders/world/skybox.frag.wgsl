#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let ray: vec3f = in.pos.xyz - u_base.view_pos;
	let r: f32 = length(ray);
	let phi: f32 = sign(ray.z) * acos(ray.x / sqrt(ray.x*ray.x + ray.z*ray.z));
	let theta: f32 = acos(ray.y / r);
	let uv: vec2f = vec2f((phi / 3.1415 + 1.0) / 2.0, theta / 3.1415);

	var data: FbData;
	data.color = in.color * textureSample(t_color, t_sampler, uv);
	data.pos = in.pos;
	data.depth = length(u_base.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_base.mask);
	return encodeFbData(data);
}
