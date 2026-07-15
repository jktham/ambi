#import "../lib/data.wgsl"
#import "../lib/lighting.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;
@group(0) @binding(3) var<uniform> u_phong: PhongUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;
@group(1) @binding(2) var t_normal: texture_2d<f32>;
@group(1) @binding(3) var t_roughness: texture_2d<f32>;
@group(1) @binding(4) var t_specular: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let tangent = in.tangent;
	let bitangent = cross(in.normal, in.tangent);
	let tbn = mat3x3f(tangent, bitangent, in.normal);

	let normalmap = textureSample(t_normal, t_sampler, in.uv).xyz; // 0=-1, 0.5=0, 1=+1, neutral texture is (0.5, 0.5, 1.0)
	let normal = tbn * normalize(normalmap * 2.0 - 1.0);

	let roughness = textureSample(t_roughness, t_sampler, in.uv).r; // 0=shiny, 0.5=neutral, 1=rough
	var material = u_phong.material;
	material.shininess *= max(0.1, (1.0 - roughness) * 2.0);

	let specular = textureSample(t_specular, t_sampler, in.uv).rgb; // 0=no spec, 0.5=neutral, 1=double spec
	material.specular *= specular * 2.0;

	let lighting = phong_color(in.pos, normal, u_global.view_pos, material, u_phong.light);

	var data: FbData;
	data.color = in.color * vec4f(lighting, 1.0) * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
