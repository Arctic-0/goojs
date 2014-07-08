define([
	'goo/entities/World',
	'goo/entities/components/CameraComponent',
	'goo/renderer/Camera',
	'goo/loaders/DynamicLoader',
	'test/loaders/Configs'
], function(
	World,
	CameraComponent,
	Camera,
	DynamicLoader,
	Configs
) {
	'use strict';
	function wait(promise, time) {
		time = time || 1;
		waitsFor(function() { return promise.isResolved; }, 'promise does not get resolved', time);
	}

	describe('CameraComponentHandler', function() {
		var loader;
		beforeEach(function() {
			var world = new World();
			loader = new DynamicLoader({
				world: world,
				rootPath: './',
				ajax: false
			});
		});

		it('loads an entity with a cameraComponent', function() {
			var config = Configs.entity(['camera']);
			loader.preload(Configs.get());
			var p = loader.load(config.id).then(function(entity) {
				expect(entity.cameraComponent).toEqual(jasmine.any(CameraComponent));
				expect(entity.cameraComponent.camera).toEqual(jasmine.any(Camera));
			});
			wait(p);
		});
		it('loads the correct camera settings', function() {
			var config = Configs.entity(['camera']);
			loader.preload(Configs.get());
			var p = loader.load(config.id).then(function(entity) {
				var camera = entity.cameraComponent.camera;
				var cameraConfig = config.components.camera;
				for (var key in cameraConfig) {
					if (key !== 'projectionMode') {
						expect(camera[key]).toBe(cameraConfig[key]);
					}
				}
			});
			wait(p);
		});
	});
});