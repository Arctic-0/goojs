require([
	'goo/math/Vector3',
	'goo/shapes/Box',
	'lib/V',
	'goo/entities/SystemBus',
	'goo/entities/components/HtmlComponent',
	'goo/entities/systems/HtmlSystem',
	'goo/addons/particlepack/components/ParticleSystemComponent',
	'goo/addons/particlepack/systems/ParticleSystemSystem',
	'goo/addons/particlepack/curves/ConstantCurve',
	'goo/addons/particlepack/curves/LinearCurve',
	'goo/addons/particlepack/curves/Vector3Curve',
	'goo/addons/linerenderpack/LineRenderSystem'
], function (
	Vector3,
	Box,
	V,
	SystemBus,
	HtmlComponent,
	HtmlSystem,
	ParticleSystemComponent,
	ParticleSystemSystem,
	ConstantCurve,
	LinearCurve,
	Vector3Curve,
	LineRenderSystem
) {
	'use strict';

	var goo = V.initGoo();
	var world = goo.world;
	V.addLights();

	var lineRenderSystem = new LineRenderSystem(world);
	goo.setRenderSystem(lineRenderSystem);

	var colors = [
		new Vector3(1, 1, 1),
		new Vector3(1, 0, 0),
		new Vector3(0, 1, 0),
		new Vector3(0, 0, 1),
		new Vector3(0, 1, 1),
		new Vector3(1, 0, 1),
		new Vector3(1, 1, 0)
	];

	world.setSystem(new ParticleSystemSystem());
	world.setSystem(new HtmlSystem(goo.renderer));
	V.addOrbitCamera(new Vector3(40, Math.PI / 2, 0));
	
	var entities = [];

	for(var i=0; i<2; i++){
		var entity = world.createEntity([(i-1/2) * 10,-13,0], new ParticleSystemComponent({
			seed: 123,
			loop: true,
			localSpace: i === 0,
			maxParticles: 5,
			emissionRate: new ConstantCurve({ value: 5 }),
			startSize: new ConstantCurve({ value: 0.3 }),
			startSpeed: new LinearCurve({ m: 5, k: 0 }),
			localVelocity: new Vector3Curve({
				x: new ConstantCurve({ value: 0 }),
				y: new ConstantCurve({ value: 0 }),
				z: new ConstantCurve({ value: 100 }) // <-- should point in +x after rotation, and cancel out worldVelocity
			}),
			worldVelocity: new Vector3Curve({
				x: new ConstantCurve({ value: -100 }), // <-- should cancel out
				y: new ConstantCurve({ value: 0 }),
				z: new ConstantCurve({ value: 0 })
			}),
			preWarm: false,
			coneAngle: Math.PI / 32
		})).addToWorld();
		entities.push(entity);
		entity.setRotation(0,Math.PI / 2,0);

		// HTML below
		var htmlElement = document.createElement('p');
		htmlElement.style.position = 'absolute';
		htmlElement.style['-webkit-user-select'] = 'none';
		htmlElement.style.color = 'white';
		htmlElement.innerHTML = i === 0 ? 'localSpace' : 'worldSpace';
		document.body.appendChild(htmlElement);
		var htmlComponent = new HtmlComponent(htmlElement);
		world.createEntity(entity.getTranslation()).addToWorld().set(htmlComponent);
	}

	var markerPosition = new Vector3();
	goo.callbacks.push(function(){
		entities.forEach(function(entity){
			var particles = entity.particleSystemComponent.particles;
			for(var i=0; i<particles.length; i++){
				var particle = particles[i];
				if(particle.active){
					particle.getWorldPosition(markerPosition);
					lineRenderSystem.drawCross(markerPosition, colors[i % colors.length], 1);
				}
			}
		});
	});

	V.goo.renderer.setClearColor(0, 0, 0, 1);
});