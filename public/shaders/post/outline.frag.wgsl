#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: PostBaseUniforms;

@group(1) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(1) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(1) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = u_base.time;
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

	const sobel_v = mat3x3f(-1, -2, -1, 0, 0, 0, 1, 2, 1);
	const sobel_h = mat3x3f(-1, 0, 1, -2, 0, 2, -1, 0, 1);

	const N = 3;
	const S = 2;
	var normal_v = 0.0;
	var normal_h = 0.0;
	var depth_v = 0.0;
	var depth_h = 0.0;
	var mask = 0u;
	var min_depth = 9999.0;
	var mask_sum = 0.0;
	var min_dot = 1.0;
	
	for (var i=0; i<N; i++) {
		for (var j=0; j<N; j++) {
			let p = clamp(vec2i(pixel) + S*vec2i(i-N/2, j-N/2), vec2i(1), vec2i(u_base.resolution - 1));
			var data_p = loadFbData(vec2u(p), fb_color, fb_pos_depth, fb_normal_mask);
			if (data_p.depth == 0.0) {
				data_p.depth = 9999.0;
			}
			normal_v += length(data.normal - data_p.normal) * sobel_v[i][j];
			normal_h += length(data.normal - data_p.normal) * sobel_h[i][j];
			depth_v += data_p.depth * sobel_v[i][j];
			depth_h += data_p.depth * sobel_h[i][j];
			if (data_p.depth <= min_depth) {
				mask = data_p.mask;
			}
			min_depth = min(min_depth, data_p.depth);
			mask_sum += f32(data_p.mask);
			if (length(data_p.normal) > 0.01) {
				min_dot = min(min_dot, abs(dot(data.normal, data_p.normal)));
			}
		}
	}
	normal_v /= (N*N);
	normal_h /= (N*N);
	depth_v /= (N*N);
	depth_h /= (N*N);
	mask_sum /= (N*N);

	let normal_edge = sqrt(normal_h*normal_h + normal_v*normal_v);
	let depth_edge = sqrt(depth_h*depth_h + depth_v*depth_v);

	var color = data.color;
	// color = vec4f(0.0);
	if (depth_edge > 2.0 || // large dist to reduce flat horizon
		(depth_edge > 0.1 && abs(mask_sum - f32(mask)) > 0.01) || // shorter dist when different mask
		(min_dot < 0.01 && normal_edge > 0.62 && depth_edge > 0.0 && mask == 0) // orthogonal self edges
	) {
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
