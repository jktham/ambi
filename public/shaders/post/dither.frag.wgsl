#import "../data.wgsl"
#import "../lighting.wgsl"

struct PostDitherUniforms {
	res: f32,
	scale: f32,
	strength: f32,
	threshold: f32,
	frames: f32,
	speed: f32,
};

@group(0) @binding(0) var<uniform> u_post: PostUniforms;
@group(0) @binding(1) var<uniform> u_dither: PostDitherUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_noise: texture_2d<f32>;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = u_post.time;
	let pixel = vec2i(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);
	
	var lum = luminance(data.color);

	let RES = vec2i(i32(u_dither.res), i32(u_dither.res));
	let SCALE = i32(u_dither.scale);
	let STRENGTH = u_dither.strength;
	let THRESHOLD = u_dither.threshold;
	let SPEED = i32(u_dither.speed);

	let noise = (textureLoad(t_noise, (pixel / SCALE) % RES, 0).rgb - 0.5) * STRENGTH;

	let FRAMES = i32(u_dither.frames);
	let i = i32(u_post.frame) % (FRAMES*SPEED) / SPEED;
	lum += noise[u32(i)];

	let quantized = select(vec4f(0.0, 0.0, 0.0, 1.0), vec4f(1.0, 1.0, 1.0, 1.0), lum >= THRESHOLD);

	return quantized;
}
