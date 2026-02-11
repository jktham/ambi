#import "../data.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let speed = select(u_object.frag_config.x, 1.0, u_object.frag_config.x == 0.0);
	let t = u_global.time * speed;
	let rainbow = vec4f(abs(sin(in.uv.x*3 + t*3)), abs(cos(in.uv.x*3 + t*1))*abs(cos(in.uv.y*3 + t*-1)), abs(sin(in.uv.y*3 + t*2)), 1.0);

	var data: FbData;
	data.color = rainbow * in.color * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
