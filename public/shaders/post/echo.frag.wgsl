#import "../data.wgsl"

struct PostEchoUniforms {
	pulse_origins: array<vec3f, 16>,
	pulse_colors: array<vec4f, 16>,
	pulse_times: array<f32, 16>,
};

@group(0) @binding(0) var<uniform> u_post: PostUniforms;
@group(0) @binding(1) var<storage, read> u_echo: PostEchoUniforms;

@group(1) @binding(0) var t_sampler: sampler;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = u_post.time;
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

	const PI = 3.14159265359;
	const SPEED = 40.0;
	const WIDTH = 60.0;
	const AMPLITUDE = 0.9;
	const DECAY = 5.0;

	var pulse = vec4f(0.0);
	for (var i = 0; i < 16; i++) {
		let origin = u_echo.pulse_origins[i];
		if (length(origin) < 0.001) { // skip uninitialized slots
			continue;
		}
		let time = u_echo.pulse_times[i];
		let dist = distance(data.pos, origin);

		let t = ((u_post.time - time)*SPEED - dist)*1/WIDTH;
		let sawtooth = fract(clamp(1 - t, 0.0, 1.0));

		var p = pow(sawtooth, DECAY)*AMPLITUDE;
		if (sawtooth > 0.995) {
			p = 4.0;
		}
		pulse += p * u_echo.pulse_colors[i];
	}

	return data.color * pulse;
}
