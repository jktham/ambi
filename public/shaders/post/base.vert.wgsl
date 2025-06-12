struct VertexOut {
	@builtin(position) ndc: vec4f,
	@location(0) pos: vec3f,
	@location(1) uv: vec2f
};

@vertex 
fn main(@builtin(vertex_index) vertexIndex : u32) -> VertexOut {
	let pos = array(
		vec2f(-1, -1),
		vec2f(1, -1),
		vec2f(1, 1),
		vec2f(1, 1),
		vec2f(-1, 1),
		vec2f(-1, -1)
	);

	var out: VertexOut;
	out.ndc = vec4f(pos[vertexIndex], 0.0, 1.0);
	out.pos = vec3f(pos[vertexIndex], 0.0);
	out.uv = vec2f((pos[vertexIndex].x + 1.0) / 2.0, 1.0 - (pos[vertexIndex].y + 1.0) / 2.0);
	return out;
}

