#import "../data.wgsl"
#import "../lighting.wgsl"

struct PostAsciiUniforms {
	size: f32,
	scale: f32,
	samples: f32,
	stages: f32,
};

@group(0) @binding(0) var<uniform> u_post: PostUniforms;
@group(0) @binding(1) var<uniform> u_ascii: PostAsciiUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_chars: texture_2d<f32>;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = u_post.time;
	let pixel = vec2i(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

	let SIZE = i32(u_ascii.size);
	let SCALE = i32(u_ascii.scale);
	let SAMPLES = i32(u_ascii.samples);
	let STAGES = i32(u_ascii.stages);
	let N = SIZE * SCALE;
	let STEP = max(1, N / SAMPLES);
	
	let xy = floor(in.screen.xy / f32(N)) * f32(N);

    var lum = 0.0;
	var count = 0;
    for (var i = 0; i < N; i += STEP) {
        for (var j = 0; j < N; j += STEP) {
            lum += luminance(textureLoad(fb_color, vec2i(xy) + vec2i(i, j)));
			count += 1;
        }
    }
    lum = lum / f32(count);

    let offset = vec2i(pixel / SCALE) % vec2i(SIZE);
    let quantized = i32(clamp(lum, 0.0, 0.999) * f32(STAGES));

    return textureLoad(t_chars, offset + vec2i(quantized*SIZE, 0), 0);
}
