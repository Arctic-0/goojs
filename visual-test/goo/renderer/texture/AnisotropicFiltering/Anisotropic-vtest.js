require([
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Camera',
	'goo/shapes/Box',
	'goo/scripts/OrbitCamControlScript',
	'goo/entities/components/ScriptComponent',
	'goo/math/Vector3',
	'goo/renderer/TextureCreator',
	'goo/scripts/Scripts',
	'lib/V'
], function (
	Material,
	ShaderLib,
	Camera,
	Box,
	OrbitCamControlScript,
	ScriptComponent,
	Vector3,
	TextureCreator,
	Scripts,
	V
) {
	'use strict';

	var resourcePath = '../../../../resources/';

	var goo = V.initGoo();
	var world = goo.world;

	var textureCreator = new TextureCreator();

	var boxEntity = createBoxEntity();
	boxEntity.set([-50, -0.5, 0]).addToWorld();

	boxEntity = createBoxEntity(goo.renderer.capabilities.maxAnisotropy);
	boxEntity.set([50, -0.5, 0]).addToWorld();

	V.addLights();

	var orbitScript = Scripts.create(OrbitCamControlScript, {
		spherical: new Vector3(1, 90, 0.1 * 180 / Math.PI),
		minAscent: 0.1,
		turnSpeedHorizontal: 0.001,
		turnSpeedVertical: 0.001
	});
	world.createEntity('CameraEntity', new Camera(45, 1, 0.1), orbitScript).addToWorld();

	function createBoxEntity(anisotropy) {
		var meshData = new Box(100, 1, 100, 200, 200);
		var material = new Material(ShaderLib.texturedLit);
		var entity = world.createEntity(meshData, material);

		var texture = textureCreator.loadTexture2D(resourcePath + 'font.png', { anisotropy: anisotropy });
		material.setTexture('DIFFUSE_MAP', texture);

		return entity;
	}
});