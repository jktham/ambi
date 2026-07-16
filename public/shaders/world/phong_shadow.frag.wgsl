#import "../lib/data.wgsl"
#import "../lib/lighting.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;
@group(0) @binding(3) var<uniform> u_phong: PhongUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_sampler_direct: sampler;
@group(1) @binding(2) var t_color: texture_2d<f32>;
@group(1) @binding(3) var shadow_map: texture_depth_2d;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let shadowspace_depth = in.shadow_space.z / in.shadow_space.w;
	let shadow_uv = (in.shadow_space.xyz / in.shadow_space.w) * 0.5 + 0.5;
	let shadowmap_depth = textureSample(shadow_map, t_sampler_direct, shadow_uv.xy * vec2f(1.0, -1.0) + vec2f(0.0, 1.0));

	var data: FbData;
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	// slope based bias
	let shadow_bias = u_object.frag_config.x;
	let bias = max(shadow_bias * (1.0 - dot(in.normal, normalize(u_phong.light.pos - in.pos))), shadow_bias / 10.0);

	var shade = false;
	if (shadowspace_depth + bias < shadowmap_depth) {
		shade = true;
	}

	// cleared value
	if (shadowmap_depth == 0.0) {
		shade = false;
	}
	// outside frustum
	if (shadow_uv.x > 1.0 || shadow_uv.x < 0.0 || shadow_uv.y > 1.0 || shadow_uv.y < 0.0 || shadow_uv.z > 1.0 || shadow_uv.z < 0.0) {
		shade = false;
	}

	let lighting = phong_color(in.pos, in.normal, u_global.view_pos, u_phong.material, u_phong.light);

	data.color = in.color * select(vec4f(lighting, 1.0), vec4f(u_phong.material.ambient, 1.0), shade) * textureSample(t_color, t_sampler, in.uv);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
