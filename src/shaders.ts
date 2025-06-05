export const vert = /* wgsl */ `
struct VertexIn {
	@location(0) pos: vec3f,
	@location(1) color: vec4f
};

// data structure to store output of vertex function
struct VertexOut {
	@builtin(position) pos: vec4f,
	@location(0) color: vec4f
};

struct Uniforms {
	time: f32,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// process the points of the triangle
@vertex 
fn vs(vert: VertexIn) -> VertexOut {
	var out: VertexOut;
	out.pos = uniforms.projection * uniforms.view * uniforms.model * vec4f(vert.pos, 1.0);
	out.color = vert.color * (sin(uniforms.time * 2) + 2) / 2;

	return out;
}
`

export const frag = /* wgsl */ `
// data structure to input to fragment shader
struct VertexOut {
	@builtin(position) pos: vec4f,
	@location(0) color: vec4f
};

// set the colors of the area within the triangle
@fragment 
fn fs(in: VertexOut) -> @location(0) vec4f {
	return in.color;
}
`