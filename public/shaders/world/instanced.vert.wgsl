#import "../data.wgsl"

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
fn main(in: VertexIn, @builtin(instance_index) i: u32) -> VertexOut {
	let model = u_object.model * u_instanced.instances[i].model; // not sure why this is left to right
	let normal = u_object.normal * u_instanced.instances[i].normal;
	
	var out: VertexOut;
	out.ndc = u_global.projection * u_global.view * model * vec4f(in.pos, 1.0);
	out.pos = (model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_object.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
