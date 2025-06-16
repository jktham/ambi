struct VertexIn {
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct VertexOut {
	@builtin(position) ndc: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct BaseUniforms {
	time: f32,
	frame: f32,
	mask: f32,
	resolution: vec2f,
	color: vec4f,
	view_pos: vec3f,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
	normal: mat4x4f
}

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
	var out: VertexOut;
	out.ndc = u_base.projection * u_base.view * u_instanced.instances[i].model * vec4f(in.pos, 1.0);
	out.pos = (u_instanced.instances[i].model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((u_instanced.instances[i].normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_base.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
