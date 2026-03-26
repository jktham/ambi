#import "../data.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	data.color = in.color * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	let thickness = u_object.frag_config.x;
	data.color.a = step(0.5, 1 - edgeFactor(in.bary, thickness));

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}

fn edgeFactor(bary: vec3f, thickness: f32) -> f32 {
	let d = fwidth(bary);
	let a3 = smoothstep(vec3f(0.0), d * thickness, bary);
	return min(min(a3.x, a3.y), a3.z);
}
