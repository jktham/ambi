#import "../lib/data.wgsl"
#import "../lib/lighting.wgsl"

struct PhongShadedUniforms {
	ambient: vec3f,
	diffuse: vec3f,
	specular: vec3f,
	shininess: f32,
	light_pos: vec3f,
	light_color: vec3f,
	shadow_bias: f32,
}

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;
@group(0) @binding(3) var<uniform> u_phong: PhongShadedUniforms;

@group(0) @binding(4) var shadow_map_sampler: sampler;
@group(0) @binding(5) var shadow_map: texture_depth_2d;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let shadowspace_depth = in.shadow_space.z / in.shadow_space.w;
	let shadow_uv = (in.shadow_space.xyz / in.shadow_space.w) * 0.5 + 0.5;
	let shadowmap_depth = textureSample(shadow_map, shadow_map_sampler, shadow_uv.xy * vec2f(1.0, -1.0) + vec2f(0.0, 1.0));

	var data: FbData;
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_object.mask);

	// slope based bias
	let bias = max(u_phong.shadow_bias * (1.0 - dot(in.normal, normalize(u_phong.light_pos - in.pos))), u_phong.shadow_bias / 10.0);

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


	let factors = phong_factors(in.pos, in.normal, u_global.view_pos, u_phong.light_pos);
	let diff = factors.x;
	let spec = factors.y;

	let ambient = u_phong.ambient;
	let diffuse = diff * u_phong.diffuse;
	let specular = pow(spec, u_phong.shininess) * u_phong.specular;

	let light_color = select(u_rayspheres.light_color, vec3f(0.0, 0.0, 0.0), shade);
	data.color = in.color * vec4f(ambient + (diffuse + specular) * light_color, 1.0) * textureSample(t_color, t_sampler, in.uv);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
