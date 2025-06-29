#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: PostBaseUniforms;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

fn noise(xy: vec2f, seed: f32) -> f32 {
	let PHI = 1.61803398874989484820459; 
	return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);
	var color = data.color;

	let seed = u_base.frame / 1000.0 % 10.0 + 1.0;
	let noise = noise(vec2f(pixel) + 100.0, seed);
	if (noise > 0.9) {
		let center_dist = length(vec2f(pixel) / u_base.resolution - 0.5);
		color += noise * (1.0 - center_dist) * 0.3;
	}

	return color;
}
