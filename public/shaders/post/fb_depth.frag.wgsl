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

struct PostBaseUniforms {
	time: f32,
	frame: f32,
	resolution: vec2f,
}

@group(0) @binding(0) var<uniform> u_base: PostBaseUniforms;

@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

@fragment 
fn main(in: FragmentIn) -> @location(0) vec4f {
	_ = u_base.time;
	let pixel: vec2u = vec2u(in.screen.xy);
	let data = loadFbData(pixel);
	let d = pow(1.0 - (1.0 / (data.depth + 1.0)), 2.0);
	return vec4f(d, d, d, 1.0);
}

fn loadFbData(pixel: vec2u) -> FbData {
	var data: FbData;
	let color = textureLoad(fb_color, pixel);
	let pd = textureLoad(fb_pos_depth, pixel);
	let nm = textureLoad(fb_normal_mask, pixel);

	data.color = color;
	data.pos = pd.xyz;
	data.depth = pd.w;
	data.normal = nm.xyz * 2.0 - 1.0;
	data.mask = u32(nm.w * 255.0);

	return data;
}
