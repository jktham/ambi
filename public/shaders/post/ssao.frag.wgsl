#import "../data.wgsl"
#import "../noise.wgsl"

struct PostSsaoUniforms {
	kernel: array<vec3f, 16>,
	samples: f32,
	radius: f32,
};

@group(0) @binding(0) var<uniform> u_post: PostUniforms;
@group(0) @binding(1) var<storage, read> u_ssao: PostSsaoUniforms;

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

	const NOISE = true;
	var rvec = vec3f(0, 0, 1);
	if (NOISE) {
		rvec = rndvec3(in.screen.x * in.screen.y / (u_post.resolution.x * u_post.resolution.y));
	}
	let tangent = normalize(rvec - data.normal * dot(rvec, data.normal));
	let bitangent = cross(data.normal, tangent);
	let tbn = mat3x3f(tangent, bitangent, data.normal);

	let N = i32(u_ssao.samples);
	let RADIUS = u_ssao.radius;

	var occlusion = 0.0;
	for (var i=0; i<N; i++) {
		let sample = tbn * u_ssao.kernel[i] * RADIUS + data.pos;
		let ndc = u_post.projection * u_post.view * vec4f(sample, 1.0);
		let screen = (ndc.xy * vec2f(1.0, -1.0) / ndc.w * 0.5 + 0.5) * u_post.resolution;

		var data_sample = loadFbData(vec2u(screen.xy), fb_color, fb_pos_depth, fb_normal_mask);

		if (data_sample.depth < data.depth && length(data_sample.pos - data.pos) < RADIUS) {
			occlusion += step(0.01, dot(data.normal, normalize(data_sample.pos - data.pos)));
		}
	}
	occlusion = 1 - occlusion / f32(N);

	var color = data.color;
	color = vec4f(color.rgb * occlusion, color.a);
	return color;
}
