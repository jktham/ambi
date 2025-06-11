struct FragmentIn {
	@builtin(position) screen: vec4f,
	@location(0) pos: vec3f,
	@location(1) uv: vec2f
};

struct FbData {
	color: vec4f,
	pos: vec3f,
	depth: f32,
	normal: vec3f,
	mask: u32,
}

@group(2) @binding(0) var fbColor: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fbPosDepth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fbNormalMask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel);

	return data.color;
}

fn loadFbData(pixel: vec2u) -> FbData {
	var data: FbData;
	let color = textureLoad(fbColor, pixel);
	let pd = textureLoad(fbPosDepth, pixel);
	let nm = textureLoad(fbNormalMask, pixel);

	data.color = color;
	data.pos = pd.xyz;
	data.depth = pd.w;
	data.normal = nm.xyz;
	data.mask = u32(nm.w * 255.0);

	return data;
}
