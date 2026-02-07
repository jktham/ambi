#import "../shared.wgsl"

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
fn main(in: VertexIn, @builtin(instance_index) i: u32) -> VertexOut {
	let model = u_instanced.instances[i].model * u_base.model;
	let normal = u_instanced.instances[i].normal * u_base.normal;
	
	var out: VertexOut;
	out.ndc = u_base.projection * u_base.view * model * vec4f(in.pos, 1.0);
	out.pos = (model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_base.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
