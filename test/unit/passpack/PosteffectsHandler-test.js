define([
	'goo/entities/World',
	'goo/entities/GooRunner',
	'goo/loaders/DynamicLoader',
	'goo/passpack/PosteffectsHandler',
	'test/loaders/Configs'
], function (
	World,
	GooRunner,
	DynamicLoader,
	PosteffectsHandler,
	Configs
) {
	'use strict';

	describe('PosteffectsHandler', function () {
		var loader;

		beforeEach(function () {
//			gooRunner = new GooRunner({
//				logo: false
//			});
//			world = gooRunner.world;
			var world = new World();
			loader = new DynamicLoader({
				world: world,
				rootPath: 'loaders/res/'
			});
		});

//		afterEach(function () {
//			gooRunner.clear();
//		});

		xit('loads a post effect', function (done) {
			var config = Configs.posteffects();
			loader.preload(Configs.get());
			loader.load(config.id).then(function (/*posteffects*/) {
				expect(gooRunner.renderSystem.composers.length).toEqual(1);
			});
			done();
		});

		xit('clears posteffect buffers from the GPU', function (done) {
			var config = Configs.posteffects();
			loader.preload(Configs.get());
			var composer;
			loader.load(config.id).then(function (/*posteffects*/) {
				expect(gooRunner.renderSystem.composers.length).toEqual(1);
				composer = gooRunner.renderSystem.composers[0];

				// Allocate buffers manually
				composer.readBuffer.glTexture = gooRunner.renderer.context.createTexture();
				composer.readBuffer._glFrameBuffer = gooRunner.renderer.context.createFramebuffer();
				composer.readBuffer._glRenderBuffer = gooRunner.renderer.context.createRenderbuffer();

				composer.writeBuffer.glTexture = gooRunner.renderer.context.createTexture();
				composer.writeBuffer._glFrameBuffer = gooRunner.renderer.context.createFramebuffer();
				composer.writeBuffer._glRenderBuffer = gooRunner.renderer.context.createRenderbuffer();

				return loader.clear();
			}).then(function () {
				expect(gooRunner.renderSystem.composers.length).toEqual(0);

				// Check destroyed
				expect(composer.writeBuffer.glTexture).toBeFalsy();
				expect(composer.writeBuffer._glRenderBuffer).toBeFalsy();
				expect(composer.writeBuffer._glFrameBuffer).toBeFalsy();

				expect(composer.readBuffer.glTexture).toBeFalsy();
				expect(composer.readBuffer._glRenderBuffer).toBeFalsy();
				expect(composer.readBuffer._glFrameBuffer).toBeFalsy();
				done();
			});
		});
	});
});