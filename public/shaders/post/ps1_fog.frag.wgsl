#import "../shared.wgsl"

struct PostPS1Uniforms {
	fog_start: f32,
	fog_end: f32,
	fog_color: vec4f,
}

@group(0) @binding(0) var<uniform> u_base: PostBaseUniforms;
@group(0) @binding(1) var<uniform> u_ps1: PostPS1Uniforms;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = u_base.time;
	let pixel = vec2u(in.screen.xy);
	var data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

	var fog_factor = 1.0 - ((u_ps1.fog_end - data.depth) / (u_ps1.fog_end - u_ps1.fog_start));
	let fog_color = vec4f(0.3, 0.3, 0.3, 1.0);
	if (data.mask == 255) {
		fog_factor /= 2.5;
	}
	data.color = mix(data.color, u_ps1.fog_color, clamp(fog_factor, 0.0, 1.0));

	const GLOW_SAMPLES = 10;
	const GLOW_STEP = 1;
	const GLOW_RADIUS = 10.0;
	const GLOW_STRENGTH = 0.4;
	var glow_fog_factor = 0.0;
	var glow_radius = 0.0;
	var glow_color = vec4f(0.0);
	var glow_distance = 0.0;
	for (var i = -GLOW_SAMPLES; i <= GLOW_SAMPLES; i += GLOW_STEP) {
		for (var j = -GLOW_SAMPLES; j <= GLOW_SAMPLES; j += GLOW_STEP) {
			let r = sqrt(f32(i*i + j*j));
			var d = loadFbData(vec2u(vec2i(pixel) + vec2i(i, j)), fb_color, fb_pos_depth, fb_normal_mask);
			if (d.mask == 255 && r <= GLOW_RADIUS) {
				let glow_radius_new = max(GLOW_RADIUS - r, 0.0) / GLOW_RADIUS;
				if (glow_radius_new > glow_radius) {
					glow_radius = glow_radius_new;
					glow_color = d.color;
					glow_distance = d.depth;
				}
			}
		}
	}
	
	glow_fog_factor = 1.0 - ((u_ps1.fog_end - glow_distance) / (u_ps1.fog_end - u_ps1.fog_start));
	if (glow_fog_factor > 1.0) {
		glow_fog_factor = max(1.0 - ((glow_distance - u_ps1.fog_end) / (u_ps1.fog_end - u_ps1.fog_start)), 0.3);
	}
	data.color = mix(data.color, glow_color, clamp(glow_fog_factor, 0.0, 1.0) * glow_radius * GLOW_STRENGTH);

	let dither_matrix = mat4x4f(-4, 2, -3, 3, 0, -2, 1, -1, -3, 3, -4, 2, 1, -1, 0, -2);
	let dither_value = dither_matrix[pixel.x % 4][pixel.y % 4];
	let quantized_color = vec4f(vec4u(data.color * 255.0 + dither_value) / 8) / 31.0;
	data.color = quantized_color;

	return data.color;
}
