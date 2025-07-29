#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: PostBaseUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_noise: texture_2d<f32>;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = u_base.time;
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);
	
	let threshold = 0.5;
	let lum_factors = vec4f(0.2126, 0.7152, 0.0722, 0.0);
	var lum = dot(data.color, lum_factors);

	const noise_res = vec2(64, 64);
	const noise_scale = 1;
	const noise_strength = 0.92;
	let noise = (textureLoad(t_noise, (pixel / noise_scale) % noise_res, 0).rgb - 0.5) * noise_strength;

	let i = u32(u_base.frame) % 30 / 10;
	lum += noise[i];

	let quantized = select(vec4f(0.0, 0.0, 0.0, 1.0), vec4f(1.0, 1.0, 1.0, 1.0), lum >= threshold);

	return quantized;
}
