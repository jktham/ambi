#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: PostBaseUniforms;

@group(1) @binding(0) var t_sampler: sampler;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = u_base.time;
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);
	let m = data.mask;
	let r = ((m * 3) ^ (m << 5) ^ (m << 2)) & 0xff;
	let g = ((m * 5) ^ (m << 7) ^ (m << 4)) & 0xff;
	let b = ((m * 7) ^ (m << 9) ^ (m << 6)) & 0xff;
	let color = vec3f(f32(r) / 255.0, f32(g) / 255.0, f32(b) / 255.0);
	return vec4f(color, 1.0);
}
