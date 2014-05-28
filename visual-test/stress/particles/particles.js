require([
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/math/Vector3',
	'goo/particles/ParticleLib',
	'goo/util/ParticleSystemUtils',
	'lib/V'
], function (
	Material,
	ShaderLib,
	Vector3,
	ParticleLib,
	ParticleSystemUtils,
	V
	) {
	'use strict';

	var numFires = 50;
	var scale = 2/numFires;

	function addFire(translation) {
		var material = new Material(ShaderLib.particles);
		var texture = ParticleSystemUtils.createFlareTexture();
		texture.generateMipmaps = true;
		material.setTexture('DIFFUSE_MAP', texture);
		material.blendState.blending = 'AdditiveBlending';
		material.cullState.enabled = false;
		material.depthState.write = false;
		material.renderQueue = 2002;

		ParticleSystemUtils.createParticleSystemEntity(
			world,
			ParticleLib.getFire({
				scale: scale,
				startColor: [1, 1, 0],
				endColor: [1, 0, 0]
			}),
			material
		).set(translation)
		.addToWorld();
	}

	var goo = V.initGoo();
	var world = goo.world;

	V.addOrbitCamera();

	for (var i = 0; i < numFires; i++) {
		addFire([0, 0, (i - numFires / 2) * scale*5]);
	}

	V.process();
});
