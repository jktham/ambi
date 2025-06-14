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
	frame: i32,
	color: vec4f,
	viewPos: vec3f,
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
	instanceCount: i32,
	instances: array<Instance>,
}

@group(0) @binding(0) var<uniform> baseUniforms: BaseUniforms;
@group(0) @binding(1) var<storage, read> instancedUniforms: InstancedUniforms;

@vertex 
fn main(in: VertexIn, @builtin(instance_index) i: u32) -> VertexOut {
	var out: VertexOut;
	out.ndc = baseUniforms.projection * baseUniforms.view * instancedUniforms.instances[i].model * vec4f(in.pos, 1.0);
	out.pos = (instancedUniforms.instances[i].model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((instancedUniforms.instances[i].normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * baseUniforms.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
