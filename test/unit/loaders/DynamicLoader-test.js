define([
	'goo/entities/World',
	'goo/loaders/DynamicLoader',
	'test/loaders/Configs',

	'goo/entities/systems/TransformSystem',
	'goo/entities/systems/RenderSystem',
	'goo/entities/systems/BoundingUpdateSystem',
	'goo/entities/systems/ScriptSystem',
	'goo/entities/systems/LightingSystem',
	'goo/entities/systems/CameraSystem',
	'goo/entities/systems/ParticlesSystem',
	"goo/animationpack/systems/AnimationSystem",

	'goo/sound/AudioContext',
	'goo/entities/systems/SoundSystem',

	'goo/animationpack/handlers/SkeletonHandler',
	'goo/animationpack/handlers/AnimationComponentHandler',
	'goo/animationpack/handlers/AnimationStateHandler',
	'goo/animationpack/handlers/AnimationLayersHandler',
	'goo/animationpack/handlers/AnimationClipHandler'
], function (
	World,
	DynamicLoader,
	Configs,

	TransformSystem,
	RenderSystem,
	BoundingUpdateSystem,
	ScriptSystem,
	LightingSystem,
	CameraSystem,
	ParticlesSystem,
	AnimationSystem,

	AudioContext,
	SoundSystem
) {
	'use strict';

	describe('DynamicLoader', function () {
		var loader;

		beforeEach(function () {
			var world = new World();
			world.setSystem(new TransformSystem());
			world.setSystem(new CameraSystem());
			world.setSystem(new ParticlesSystem());
			world.setSystem(new BoundingUpdateSystem());
			world.setSystem(new LightingSystem());
			world.setSystem(new AnimationSystem());
			if (AudioContext) {
				world.setSystem(new SoundSystem());
			}

			world.setSystem(new RenderSystem());

			loader = new DynamicLoader({
				world: world,
				rootPath: './'
			});
		});

		it('loads bundle', function () {
			// Create a bundlewrapper to preload and skip ajax
			var config = Configs.entity();
			var bundleRef = Configs.randomRef('bundle');

			loader.update(bundleRef, Configs.get());
			// Load bundle
			loader.load(bundleRef).then(function (done) {
				var keys = Object.keys(loader._ajax._cache);

				expect(keys).toContain(config.id);
				expect(loader._ajax._cache[config.id].components).toBeDefined();
				done();
			});
		});

		it('clears the engine', function (done) {
			var config = Configs.project(true);
			var world = loader._world;
			loader.preload(Configs.get());
			loader.load(config.id).then(function () {
				world.process();
				// We have some entities
				expect(world.entityManager.getEntities().length).toBeGreaterThan(0);
				expect(world.getSystem('TransformSystem')._activeEntities.length).toBeGreaterThan(0);

				// Someloaders are populated
				expect(loader._handlers.entity._objects.size).toBeGreaterThan(0);

				// Ajax has some cache
				expect(Object.keys(loader._ajax._cache).length).toBeGreaterThan(0);

				return loader.clear();
			}).then(function () {
				world.process();
				// Process loop is empty
				expect(world._addedEntities.length).toBe(0);
				expect(world._removedEntities.length).toBe(0);
				expect(world._changedEntities.length).toBe(0);

				// No entities in world
				expect(world.entityManager.getEntities().length).toBe(0);

				// No entities in systems
				expect(world._systems.length).toBeGreaterThan(0);
				for (var i = 0; i < world._systems.length; i++) {
					var entities = world._systems[i]._activeEntities;
					expect(entities.length).toBe(0);
				}

				// No objects in handlers
				for (var key in loader._handlers) {
					expect(loader._handlers[key]._objects.size).toBe(0);
				}

				// No configs in ajax
				var cacheCount = Object.keys(loader._ajax._cache);
				expect(cacheCount.length).toBe(0);
				done();
			});
		});

		it('preloads all binaries in json structure', function (done) {
			var entities = [];
			for (var i = 0; i < 4; i++) {
				entities[i] = Configs.entity(['transform', 'meshData']);
				if (i > 0) {
					Configs.attachChild(entities[i - 1], entities[i]);
				}
			}

			var bundleRef = Configs.randomRef('bundle');
			loader.update(bundleRef, Configs.get());

			var progress = jasmine.createSpy('progress');
			loader.load(bundleRef).then(function () {
				return loader.load(entities[0].id, {
					preloadBinaries: true,
					progressCallback: progress
				});
			}).then(function () {
				var l = entities.length;
				expect(progress).toHaveBeenCalledWith(l, l);
				done();
			});
		});
	});
});