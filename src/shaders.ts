export const vert = /* wgsl */ `
struct VertexIn {
	@location(0) pos: vec2f,
	@location(1) color: vec4f
};

// data structure to store output of vertex function
struct VertexOut {
	@builtin(position) pos: vec4f,
	@location(0) color: vec4f
};

@group(0) @binding(0) var<uniform> time: f32;

// process the points of the triangle
@vertex 
fn vs(vert: VertexIn) -> VertexOut {
	var out: VertexOut;
	out.pos = vec4f(vert.pos, 0.0, 1.0);
	out.color = vert.color * fract(time);

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