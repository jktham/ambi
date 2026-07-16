#import "../lib/data.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_sampler_direct: sampler;
@group(1) @binding(2) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	_ = t_sampler_direct;
	
	let speed = select(u_object.frag_config.x, 1.0, u_object.frag_config.x == 0.0);
	let min = select(u_object.frag_config.y, 0.0, u_object.frag_config.y == 0.0);
	let max = select(u_object.frag_config.z, 1.0, u_object.frag_config.z == 0.0);
	let t = u_global.time * speed;
	let pulse = vec4f(vec3f((sin(t*2*3.14)*0.5 + 0.5) * (max - min) + min), 1.0);

	var data: FbData;
	data.color = pulse * in.color * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
