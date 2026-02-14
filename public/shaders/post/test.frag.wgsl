#import "../data.wgsl"

@group(0) @binding(0) var<uniform> u_post: PostUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color0: texture_2d<f32>;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = u_post.time;
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

	let color = textureSample(t_color0, t_sampler, in.uv);
	if (data.mask != 0) {
		return color;
	}
	return data.color;
}
