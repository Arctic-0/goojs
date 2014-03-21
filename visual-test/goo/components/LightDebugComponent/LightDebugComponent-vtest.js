require([
	'goo/entities/GooRunner',
	'goo/entities/World',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Camera',
	'goo/shapes/Sphere',
	'goo/entities/components/CameraComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/MeshData',
	'goo/entities/components/MeshRendererComponent',
	'goo/math/Vector3',
	'goo/renderer/light/PointLight',
	'goo/renderer/light/DirectionalLight',
	'goo/renderer/light/SpotLight',
	'goo/entities/components/LightComponent',
	'goo/debug/LightPointer',
	'goo/entities/components/LightDebugComponent',
	'lib/V'
], function (
	GooRunner,
	World,
	Material,
	ShaderLib,
	Camera,
	Sphere,
	CameraComponent,
	OrbitCamControlScript,
	ScriptComponent,
	MeshData,
	MeshRendererComponent,
	Vector3,
	PointLight,
	DirectionalLight,
	SpotLight,
	LightComponent,
	LightPointer,
	LightDebugComponent,
	V
	) {
	'use strict';

	var lightsState = {
		pointLightOn: false,
		directionalLightOn: false,
		spotLightOn: false
	};

	function addSpin(entity/*, radiusX, radiusZ, speed, altitude*/) {
		var offset = V.rng.nextFloat() * 12;
		entity.set(function (entity) {
				var light = entity.getComponent('LightComponent').light;

				light.color.data[0] = Math.cos(World.time + offset) * 0.5 + 0.5;
				light.color.data[1] = Math.cos(World.time + offset + Math.PI * 2 / 3) * 0.5 + 0.5;
				light.color.data[2] = Math.cos(World.time + offset + Math.PI * 2 / 3 * 2) * 0.5 + 0.5;
				light.range = (Math.cos(World.time) * 0.5 + 0.5) * 6 + 2;

				/*
				if(light.angle) {
					light.angle = (Math.cos(World.time+0.3) * 0.5 + 0.5) * 40 + 20;
				}
				*/
				light.changedProperties = true;
				light.changedColor = true;
			});
	}

	function addPointLight() {
		var pointLight = new PointLight(new Vector3(0.9, 0.0, 0.2));
		pointLight.range = 8;

		var pointLightOrbitRadius = 5;
		var pointLightOrbitSpeed = 0.5;
		var pointLightAltitude = 0;

		var pointLightEntity = world.createEntity(pointLight, new LightDebugComponent(), [0, 0, 3]);

		addSpin(pointLightEntity, pointLightOrbitRadius, pointLightOrbitRadius, pointLightOrbitSpeed, pointLightAltitude);
		pointLightEntity.addToWorld();
		world.process();

		lightsState.pointLightOn = true;
	}

	function addDirectionalLight() {
		var directionalLight = new DirectionalLight(new Vector3(0.2, 0.9, 0.0));
		directionalLight.intensity = 0.25;

		var directionalLightOrbitRadius = 0;
		var directionalLightOrbitSpeed = 0.7;
		var directionalLightAltitude = -5;

		var directionalLightEntity = world.createEntity(directionalLight, new LightDebugComponent(), [0, -5, 3]);

		addSpin(directionalLightEntity, directionalLightOrbitRadius, directionalLightOrbitRadius, directionalLightOrbitSpeed, directionalLightAltitude);
		directionalLightEntity.addToWorld();
		world.process();

		lightsState.directionalLightOn = true;
	}

	function addSpotLight() {
		var spotLight = new SpotLight(new Vector3(0.2, 0.4, 1.0));
		spotLight.angle = 15;
		spotLight.range = 10;
		spotLight.exponent = 0.0;

		var spotLightOrbitRadius = 5;
		var spotLightOrbitSpeed = 0.3;
		var spotLightAltitude = 5;

		var spotLightEntity = world.createEntity(spotLight, new LightDebugComponent(), [0, 5, 5]);

		addSpin(spotLightEntity, spotLightOrbitRadius, spotLightOrbitRadius * 2, spotLightOrbitSpeed, spotLightAltitude);
		spotLightEntity.addToWorld();
		world.process();

		lightsState.spotLightOn = true;
	}

	function removePointLight() {
		world.entityManager.getEntityByName('pointLight').removeFromWorld();
		lightsState.pointLightOn = false;
	}

	function removeDirectionalLight() {
		world.entityManager.getEntityByName('directionalLight').removeFromWorld();
		lightsState.directionalLightOn = false;
	}

	function removeSpotLight() {
		world.entityManager.getEntityByName('spotLight').removeFromWorld();
		lightsState.spotLightOn = false;
	}

	var goo = V.initGoo();
	var world = goo.world;

	// add spheres to cast light on
	V.addSpheres();

	addPointLight();
	addDirectionalLight();
	addSpotLight();

	document.body.addEventListener('keypress', function(e) {
		switch(e.keyCode) {
			case 49:
				if(lightsState.spotLightOn) { removeSpotLight();	}
				else { addSpotLight(); }
				break;
			case 50:
				if(lightsState.pointLightOn) { removePointLight(); }
				else { addPointLight(); }
				break;
			case 51:
				if(lightsState.directionalLightOn) { removeDirectionalLight(); }
				else { addDirectionalLight(); }
				break;
			default:
				console.log('Keys 1 to 3 switch light on/off');
		}
	});

	// camera
	V.addOrbitCamera();
});
