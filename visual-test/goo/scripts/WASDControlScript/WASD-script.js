require([
	'goo/entities/GooRunner',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/MeshData',
	'goo/entities/components/MeshRendererComponent',
	'goo/math/Vector3',
	'goo/renderer/light/PointLight',
	'goo/entities/components/LightComponent',
	'goo/scripts/ScriptUtils',
	'goo/math/Vector',
	'lib/V',
	'goo/scripts/Scripts'
], function (
	GooRunner,
	Material,
	ShaderLib,
	Camera,
	CameraComponent,
	ScriptComponent,
	MeshData,
	MeshRendererComponent,
	Vector3,
	PointLight,
	LightComponent,
	ScriptUtils,
	Vector,
	V,
	Scripts
	) {
	'use strict';

	//! schteppe: Outdated and already covered in FPCamControlScript test. Delete?

	function WASDControlScriptDemo() {
		var goo = V.initGoo();

		V.addLights();

		V.addColoredSpheres();

		// add camera
		var camera = new Camera();
		var cameraEntity = goo.world.createEntity(camera, 'CameraEntity', [0, 0, 20]).lookAt([0, 0, 0]).addToWorld();

		// camera control set up
		var scripts = new ScriptComponent();
		var wasdScript = Scripts.create('WASD', {
			domElement: goo.renderer.domElement
		});

		// WASD control script to move around
		scripts.scripts.push(wasdScript);

		// the FPCam script itself that locks the pointer and moves the camera
		var fpScript = Scripts.create('FPCamControlScript', {
			domElement: goo.renderer.domElement
		});
		scripts.scripts.push(fpScript);

		cameraEntity.setComponent(scripts);
	}

	WASDControlScriptDemo();
});