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
	color: vec4f,
	view_pos: vec3f,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
	normal: mat4x4f
}

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@vertex 
fn main(in: VertexIn) -> VertexOut {
	var out: VertexOut;
	out.ndc = u_base.projection * u_base.view * u_base.model * vec4f(in.pos, 1.0);
	out.pos = (u_base.model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((u_base.normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_base.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
