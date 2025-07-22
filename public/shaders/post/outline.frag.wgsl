#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: PostBaseUniforms;

@group(1) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(1) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(1) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = u_base.time;
	let pixel: vec2u = vec2u(in.screen.xy);

	const sobel_v = mat3x3f(-1, -2, -1, 0, 0, 0, 1, 2, 1);
	const sobel_h = mat3x3f(-1, 0, 1, -2, 0, 2, -1, 0, 1);

	const N = 3;
	const S = 2;
	var normal_v = vec3f(0.0);
	var normal_h = vec3f(0.0);
	var depth_v = 0.0;
	var depth_h = 0.0;
	var mask = 0u;
	var min_depth = 9999.0;
	var mask_sum = 0.0;
	for (var i=0; i<N; i++) {
		for (var j=0; j<N; j++) {
			var data = loadFbData(vec2u(vec2i(pixel) + S*vec2i(i-N/2, j-N/2)), fb_color, fb_pos_depth, fb_normal_mask);
			if (data.depth == 0.0) {
				data.depth = 9999.0;
			}
			normal_v += data.normal * sobel_v[i][j];
			normal_h += data.normal * sobel_h[i][j];
			depth_v += data.depth * sobel_v[i][j];
			depth_h += data.depth * sobel_h[i][j];
			if (data.depth <= min_depth) {
				mask = data.mask;
			}
			min_depth = min(min_depth, data.depth);
			mask_sum += f32(data.mask);
		}
	}
	normal_v /= (N*N);
	normal_h /= (N*N);
	depth_v /= (N*N);
	depth_h /= (N*N);
	mask_sum /= (N*N);

	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);
	var color = data.color;
	// color = vec4f(0.0);
	if (((length(normal_v) > 0.1 || length(normal_h) > 0.1) && (abs(depth_v) > 0.5 || abs(depth_h) > 0.5 || mask_sum != f32(mask))) || (abs(depth_v) > 2.0 || abs(depth_h) > 2.0)) {
		switch mask {
			case 1: {
				color = vec4f(1.0, 0.0, 0.0, 1.0);
			}
			case 2: {
				color = vec4f(0.0, 1.0, 0.0, 1.0);
			}
			case 3: {
				color = vec4f(0.0, 0.0, 1.0, 1.0);
			}
			default: {
				color = vec4f(1.0, 1.0, 1.0, 1.0);
			}
		}
	}
	return color;
}
