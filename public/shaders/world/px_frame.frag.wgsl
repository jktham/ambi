#import "../lib/data.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_sampler_direct: sampler;
@group(1) @binding(2) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	_ = t_sampler;
	_ = t_sampler_direct;
	_ = t_color;

	let px = in.screen.xy - 0.5; // [0, resolution)
	let uv = px / u_global.resolution; // [0, 1)

	var color = vec4(uv.x, 0.0, uv.y, 1.0);
	if all(px == floor(u_global.resolution / 2.0)) {
		color = vec4(1.0, 1.0, 1.0, 1.0);
	}

	if any(px == vec2(0)) || any(px == u_global.resolution - 1) {
		color = vec4(1.0, 1.0, 1.0, 1.0);
	}

	var data: FbData;
	data.color = color;
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
