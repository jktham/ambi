#import "../data.wgsl"

struct PS1VertexOut {
	@builtin(position) ndc: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f,
	@location(4) w: f32
};

struct Instance {
	model: mat4x4f,
	normal: mat4x4f,
}

struct InstancedUniforms {
	instance_count: i32,
	instances: array<Instance>,
}

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;
@group(0) @binding(2) var<storage, read> u_instanced: InstancedUniforms;

@vertex 
fn main(in: VertexIn, @builtin(instance_index) i: u32) -> PS1VertexOut {
	let model = u_object.model * u_instanced.instances[i].model;
	let normal = u_object.normal * u_instanced.instances[i].normal;

	var out: PS1VertexOut;
	out.ndc = u_global.projection * u_global.view * model * vec4f(in.pos, 1.0);
	out.pos = (model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_object.color * out.ndc.w;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y) * out.ndc.w;

	var rounded_ndc: vec2f = (round((out.ndc.xy / out.ndc.w) * (u_global.resolution / 2)) / (u_global.resolution / 2)) * out.ndc.w;
	out.ndc = vec4f(rounded_ndc, out.ndc.z, out.ndc.w);
	out.w = out.ndc.w;

	return out;
}
