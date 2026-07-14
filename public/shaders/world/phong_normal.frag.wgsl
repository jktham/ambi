#import "../lib/data.wgsl"
#import "../lib/lighting.wgsl"

struct PhongUniforms {
	ambient: vec3f,
	diffuse: vec3f,
	specular: vec3f,
	shininess: f32,
	light_pos: vec3f,
	light_color: vec3f,
}

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;
@group(0) @binding(3) var<uniform> u_phong: PhongUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;
@group(1) @binding(2) var t_normal: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	let tangent = in.tangent;
	let bitangent = cross(in.normal, in.tangent);
	let tbn = mat3x3f(tangent, bitangent, in.normal);

	let normalmap = normalize(textureSample(t_normal, t_sampler, in.uv).xyz * 2.0 - 1.0); // [-1, 1]
	let normal = tbn * normalmap;

	let factors = phong_factors(in.pos, normal, u_global.view_pos, u_phong.light_pos);
	let diff = factors.x;
	let spec = factors.y;

	let ambient = u_phong.ambient;
	let diffuse = diff * u_phong.diffuse;
	let specular = pow(spec, u_phong.shininess) * u_phong.specular;

	var data: FbData;
	data.color = in.color * vec4f(ambient + (diffuse + specular) * u_phong.light_color, 1.0) * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_global.view_pos - in.pos);
	data.normal = normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
