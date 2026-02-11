#import "../data.wgsl"
#import "../lighting.wgsl"

struct Sphere {
	pos: vec4f, // w is radius
	color: vec4f,
}

struct RaysphereUniforms {
	ambient_factor: f32,
	diffuse_factor: f32,
	specular_factor: f32,
	specular_exponent: f32,
	light_pos: vec3f,
	light_color: vec4f,
	sphere_count: f32,
	background_color: vec4f,
	spheres: array<Sphere>,
}

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;
@group(0) @binding(3) var<storage, read> u_rayspheres: RaysphereUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

struct Ray {
	origin: vec3f,
	direction: vec3f,
}

fn intersectSphere(ray: Ray, position: vec4f) -> f32 {
	let a = dot(ray.direction, ray.direction);
	let offset = ray.origin - position.xyz;
	let b = 2.0 * dot(ray.direction, offset);
	let c = dot(offset, offset) - (position.w*position.w);
	if (b*b - 4.0*a*c < 0.0) {
		return -1.0;
	}
	return (-b - sqrt((b*b) - 4.0*a*c))/(2.0*a);
}

@fragment
fn main(in: FragmentIn) -> FragmentOut {
	const PI = 3.141592653589793;
	const far = 100.0;
	const near = 0.01;

	var uv = in.screen.xy / u_global.resolution - vec2f(0.5);
	uv.y *= u_global.resolution.y / u_global.resolution.x * -1.0;
	uv *= 1.366; // magic idk, depends on fov

	let camera_pos = (u_global.view_inv * vec4f(0.0, 0.0, 0.0, 1.0)).xyz;
	let camera_dir = (u_global.view_inv * vec4f(0.0, 0.0, -1.0, 0.0)).xyz;
	let ray_offset = (u_global.view_inv * vec4f(uv.x, uv.y, 0.0, 0.0)).xyz;

	let ray_dir = normalize(camera_dir + ray_offset * u_global.fov / 180.0 * PI);
	let ray = Ray(camera_pos, ray_dir);

	var color = u_rayspheres.background_color;
	var normal = normalize(-ray_dir);

	var t = far;
	var j = 0;
	for (var i = 0; i < i32(u_rayspheres.sphere_count); i++) {
		if (u_rayspheres.spheres[j].pos.w == 0.0) {
			continue;
		}
		let t2 = intersectSphere(ray, vec4f((u_object.model * vec4f(u_rayspheres.spheres[i].pos.xyz, 1.0)).xyz, u_rayspheres.spheres[i].pos.w));
		if ((t2 > near && t2 < t) || t < near) {
			t = t2;
			j = i;
		}
	}
	if (t > near && t < far) {
		color = phong(
			u_rayspheres.spheres[j].color,
			camera_pos + ray_dir * t,
			normalize((camera_pos + ray_dir * t) - (u_object.model * vec4f(u_rayspheres.spheres[j].pos.xyz, 1.0)).xyz),
			u_global.view_pos,
			u_rayspheres.ambient_factor,
			u_rayspheres.diffuse_factor,
			u_rayspheres.specular_factor,
			u_rayspheres.specular_exponent,
			u_rayspheres.light_pos,
			u_rayspheres.light_color
		);
	} else {
		t = far;
	}

	var data: FbData;
	data.color = color * in.color * textureSample(t_color, t_sampler, in.uv);
	data.pos = camera_pos + ray_dir * t;
	data.depth = t;
	data.normal = normal;
	data.mask = u32(u_object.mask);

	decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
	return encodeFbData(data);
}
