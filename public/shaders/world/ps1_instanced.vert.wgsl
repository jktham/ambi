#import "../shared.wgsl"

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

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;
@group(0) @binding(1) var<storage, read> u_instanced: InstancedUniforms;

@vertex 
fn main(in: VertexIn, @builtin(instance_index) i: u32) -> PS1VertexOut {
	var out: PS1VertexOut;
	out.ndc = u_base.projection * u_base.view * u_instanced.instances[i].model * vec4f(in.pos, 1.0);
	out.pos = (u_instanced.instances[i].model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((u_instanced.instances[i].normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_base.color * out.ndc.w;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y) * out.ndc.w;

	var rounded_ndc: vec2f = (round((out.ndc.xy / out.ndc.w) * (u_base.resolution / 2)) / (u_base.resolution / 2)) * out.ndc.w;
	out.ndc = vec4f(rounded_ndc, out.ndc.z, out.ndc.w);
	out.w = out.ndc.w;

	return out;
}
