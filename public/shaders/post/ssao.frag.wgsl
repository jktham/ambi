#import "../data.wgsl"
#import "../noise.wgsl"

struct PostSsaoUniforms {
	kernel: array<vec3f, 64>,
	samples: f32,
	radius: f32,
	noise: f32,
};

@group(0) @binding(0) var<uniform> u_post: PostUniforms;
@group(0) @binding(1) var<storage, read> u_ssao: PostSsaoUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_noise: texture_2d<f32>;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = t_sampler;
	_ = u_post.time;
	_ = t_noise;
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);

	var rvec = vec3f(0, 0, 1);
	if (u_ssao.noise == 1.0) {
		let noise = textureLoad(t_noise, vec2u(in.screen.xy) % textureDimensions(t_noise), 0).rgb;
		rvec = vec3f(noise.rg * 2.0 - 1.0, 0.0);
	}

	// in view space
	let normal = (u_post.view * vec4f(data.normal, 0.0)).xyz;
	let pos = (u_post.view * vec4f(data.pos, 1.0)).xyz;
	let tangent = normalize(rvec - normal * dot(rvec, normal));
	let bitangent = cross(normal, tangent);
	let tbn = mat3x3f(tangent, bitangent, normal);

	let N = i32(u_ssao.samples);
	let RADIUS = u_ssao.radius;

	var occlusion = 0.0;
	for (var i=0; i<N; i++) {
		let sample = (tbn * u_ssao.kernel[i]) * RADIUS + pos;
		let ndc = u_post.projection * vec4f(sample, 1.0);
		let screen = (ndc.xy * vec2f(1.0, -1.0) / ndc.w * 0.5 + 0.5) * u_post.resolution;

		let data_sample = loadFbData(vec2u(screen.xy), fb_color, fb_pos_depth, fb_normal_mask);
		let sample_pos = (u_post.view * vec4f(data_sample.pos, 1.0)).xyz;
		let offset = sample_pos - pos;

		const DEPTH_BIAS = 0.005;
		const NORMAL_BIAS = 0.01;
		if (data_sample.depth < data.depth - DEPTH_BIAS && 
			length(offset) < RADIUS && 
			dot(normal, normalize(offset)) > NORMAL_BIAS
		) {
			let range_factor = smoothstep(0.0, 1.0, RADIUS / abs(data.depth - data_sample.depth));
			occlusion += range_factor;
		}
	}
	occlusion = 1 - occlusion / f32(N);

	return vec4f(data.color.rgb * occlusion, data.color.a);
}
