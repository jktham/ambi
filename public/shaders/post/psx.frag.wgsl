#import "../lib/data.wgsl"

@group(0) @binding(0) var<uniform> u_post: PostUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_sampler_direct: sampler;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = t_sampler_direct;
	_ = u_post.time;
	let pixel = vec2i(in.screen.xy);
	var data = decodeFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

	let dither_matrix = mat4x4f(
		-4, 2, -3, 3, 
		0, -2, 1, -1, 
		-3, 3, -4, 2, 
		1, -1, 0, -2
	);
	let dither_value = dither_matrix[pixel.x % 4][pixel.y % 4];
	let quantized_color = vec4f(vec4u(data.color * 255.0 + dither_value) / 8) / 31.0;
	data.color = quantized_color;

	return data.color;
}
