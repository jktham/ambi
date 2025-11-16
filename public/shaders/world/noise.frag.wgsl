#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

fn noise(xy: vec2f, seed: f32) -> f32 {
	let PHI = 1.61803398874989484820459; 
	return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let seed = u_base.frame / 1000.0 % 10.0 + 1.0;
	var data: FbData;
	data.color = in.color * textureSample(t_color, t_sampler, in.uv) * noise(in.screen.xy, seed);
	data.pos = in.pos;
	data.depth = length(u_base.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_base.mask);
	return encodeFbData(data);
}
