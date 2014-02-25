require([
	'goo/entities/GooRunner',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/entities/components/MeshDataComponent',
	'goo/math/Vector3',
	'goo/shapes/Box',
	'goo/shapes/Sphere',
	'goo/shapes/Torus',
	'goo/shapes/Quad',
	'goo/renderer/MeshData',
	'goo/math/Ray',
	'goo/math/Plane',
	'../../lib/V'
], function(
	GooRunner,
	Material,
	ShaderLib,
	MeshDataComponent,
	Vector3,
	Box,
	Sphere,
	Torus,
	Quad,
	MeshData,
	Ray,
	Plane,
	V
) {
	'use strict';

	// initialise goo
	var goo = V.initGoo();
	var world = goo.world;

	// add some lights
	V.addLights();

	// add the camera
	V.addOrbitCamera(new Vector3(15, Math.PI / 2, 0.3));

	// plane management
	var planeMesh = new Box(1, 10, 0.01);
	var planes = [];

	function addPlane(lookAt, distance) {
		lookAt.normalize();

		var plane = world.createEntity(planeMesh, V.getColoredMaterial()).addToWorld().lookAt(lookAt);
		plane.transformComponent.updateTransform(); // force update
		var translation = plane.transformComponent.transform.rotation.applyPost(new Vector3(0, 0, -1)).scale(distance);
		plane.setTranslation(translation);

		planes.push(new Plane(lookAt, distance));
		return plane;
	}
	// ---

	// ray management
	function buildLine(from, to) {
		var meshData = new MeshData(MeshData.defaultMap([MeshData.POSITION]), 2, 2);
		meshData.getAttributeBuffer(MeshData.POSITION).set(from.concat(to));
		meshData.getIndexBuffer().set([0, 1]);
		meshData.indexModes = ['Lines'];
		return meshData;
	}

	var rayMaterial = V.getColoredMaterial(1, 1, 1, 1);
	var rays = [];

	function addRay(origin, direction) {
		rays.push(new Ray(origin, direction));

		var rayMesh = buildLine(
			[origin.x, origin.y, origin.z],
			[origin.x + direction.x * 10, origin.y + direction.y * 10, origin.z + direction.z * 10]
		);

		world.createEntity(rayMesh, rayMaterial).addToWorld();
	}
	// ---

	// intersection points
	// pointer management
	var pointerMaterial = V.getColoredMaterial();
	var pointers = [];

	function pointerAt(position) {
		pointers.push(world.createEntity(new Sphere(32, 32, 0.05), pointerMaterial, position).addToWorld());
	}

	function clearPointers() {
		pointers.forEach(function (pointer) { pointer.removeFromWorld(); });
		pointers = [];
	}
	// ---
	function addRayPlaneIntersections() {
		rays.forEach(function (ray) {
			planes.forEach(function (plane) {
				var intersectionPoint = new Vector3();
				if (ray.intersectsPlane(plane, intersectionPoint)) {
					pointerAt(intersectionPoint);
				}
			});
		});
	}
	// ---

	// the scene
	var rayOrigin = new Vector3(-0.5, -0.5, 0);
	world.createEntity(new Sphere(32, 32, 0.1), V.getColoredMaterial(), rayOrigin).addToWorld();

	var normals = [
		new Vector3( 1, -2, 0),
		new Vector3( 0, -1, 0),
		new Vector3(-2, -1, 0)
	];

	var distanceFromOrigin = 2;

	// add planes some and rays
	normals.forEach(function (normal) {
		addPlane(normal, distanceFromOrigin);
		addRay(rayOrigin, normal);
	});

	// mark all ray-plane intersections with markers
	addRayPlaneIntersections();
	// ---
});