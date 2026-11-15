#import "../lib/data.wgsl"
#import "../lib/noise.wgsl"

struct PostCrtUniforms {
	n_scanlines: f32,
	scroll_speed: f32,
    scanline_strength_multiplicative: f32,
    scanline_strength_additive: f32,
    vignette_strength: f32,
    vignette_radius_start: f32,
    vignette_radius_end: f32,
    noise_strength_multiplicative: f32,
    noise_strength_additive: f32,
};

@group(0) @binding(0) var<uniform> u_post: PostUniforms;
@group(0) @binding(1) var<uniform> u_crt: PostCrtUniforms;

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
	let data = decodeFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

    let uv = in.screen.xy / u_post.resolution; // 0..1
    let wave = sin((uv.y * u_crt.n_scanlines - u_post.time * u_crt.scroll_speed) * 2.0 * 3.14159) * 0.5 + 0.5;

    let center_dist = length(uv * 2.0 - 1.0); // distance from center, 1 = edge, 1.41 = corner
    let vignette_dist = (center_dist - u_crt.vignette_radius_start) / (u_crt.vignette_radius_end - u_crt.vignette_radius_start);
    let vignette_factor = clamp(1.0 - vignette_dist * u_crt.vignette_strength, 0.0, 1.0);

	let seed = u_post.frame / 1000.0 % 10.0 + 1.0;
	let noise = gold_noise(vec2f(pixel) + 100.0, seed);

    return data.color * vignette_factor * (wave * u_crt.scanline_strength_multiplicative + 1.0) * (noise * u_crt.noise_strength_multiplicative + 1.0) + wave * u_crt.scanline_strength_additive + noise * u_crt.noise_strength_additive;
}
