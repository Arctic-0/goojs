require([
	'goo/math/Vector3',
	'goo/shapes/Box',
	'lib/V',
	'goo/scripts/Scripts',
	'goo/entities/SystemBus',
	'goo/entities/components/HtmlComponent',
	'goo/entities/systems/HtmlSystem',
	'goo/util/ObjectUtil',
	'goo/entities/components/ScriptComponent'
], function (
	Vector3,
	Box,
	V,
	Scripts,
	SystemBus,
	HtmlComponent,
	HtmlSystem,
	_,
	ScriptComponent
) {
	'use strict';

	var goo = V.initGoo();
	var world = goo.world;

	world.setSystem(new HtmlSystem(goo.renderer));

	V.addLights();
	V.addOrbitCamera(new Vector3(15, Math.PI / 2, 0.3));

	var entities = {
		mousedown: null,
		mouseup: null,
		click: null,
		dblclick: null,
		touchstart: null,
		touchend: null,
		mousemove: null,
		mouseover: null,
		mouseout: null
	};

	var i = 0;
	var dist = 1.2;
	var N = _.keys(entities).length;
	for (var eventType in entities) {

		// Create a cube
		var position = [i * dist - dist * (N - 1) / 2, 0, 0];
		var material = V.getColoredMaterial(1, 1, 1);
		var entity = world.createEntity(new Box(), material, position).addToWorld();

		// Attach a button script to it.
		var script = Scripts.create('ButtonScript', {
			channel: 'button' + i
		});
		var scriptComponent = new ScriptComponent(script);
		entity.setComponent(scriptComponent);
		entities[eventType] = entity;
		i++;

		// HTML sign below
		var htmlElement = document.createElement('p');
		htmlElement.style.position = 'absolute';
		htmlElement.style['-webkit-user-select'] = 'none';
		htmlElement.innerHTML = eventType;
		document.body.appendChild(htmlElement);
		var htmlComponent = new HtmlComponent(htmlElement);
		position[1] -= 1;
		world.createEntity(position).addToWorld().set(htmlComponent);
	}

	SystemBus.addListener('goo.scriptError', function (event) {
		console.log("Script error!", event);
	});

	function swapColor(entity) {
		var uniforms = entity.meshRendererComponent.materials[0].uniforms;
		if (uniforms.materialDiffuse[1] === 1) {
			uniforms.materialDiffuse = [1, 0, 0, 1];
		} else {
			uniforms.materialDiffuse = [1, 1, 1, 1];
		}
	}

	function handler(event) {
		swapColor(entities[event.type]);
	}

	SystemBus.addListener('button0.mousedown', handler);
	SystemBus.addListener('button1.mouseup', handler);
	SystemBus.addListener('button2.click', handler);
	SystemBus.addListener('button3.dblclick', handler);
	SystemBus.addListener('button4.touchstart', handler);
	SystemBus.addListener('button5.touchend', handler);
	SystemBus.addListener('button6.mousemove', handler);
	SystemBus.addListener('button7.mouseover', handler);
	SystemBus.addListener('button8.mouseout', handler);

});