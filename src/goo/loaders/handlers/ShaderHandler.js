define([
	'goo/loaders/handlers/ConfigHandler',
	'goo/renderer/Material',
	'goo/renderer/MeshData',
	'goo/renderer/Shader',
	'goo/renderer/shaders/ShaderBuilder',
	'goo/util/rsvp',
	'goo/util/PromiseUtil'
],
/** @lends */
function(
	ConfigHandler,
	Material,
	MeshData,
	Shader,
	ShaderBuilder,
	RSVP,
	PromiseUtil
) {
	"use strict";

	/**
	 * @class Handler for loading shaders into engine
	 * @extends ConfigHandler
	 * @param {World} world
	 * @param {Function} getConfig
	 * @param {Function} updateObject
	 * @private
	 */
	function ShaderHandler() {
		ConfigHandler.apply(this, arguments);
	}

	ShaderHandler.prototype = Object.create(ConfigHandler.prototype);
	ShaderHandler.prototype.constructor = ShaderHandler;
	ConfigHandler._registerClass('shader', ShaderHandler);

	/**
	 * Removes a shader
	 * @param {ref}
	 * @private
	 */
	ShaderHandler.prototype._remove = function(/*ref*/) {
		// Some sort of gl release?
	};

	/**
	 * Adds/updates/removes a shader
	 * Currently it is not possible to update a shader, so we create a new one every time
	 * @param {string} ref
	 * @param {object|null} config
	 * @param {object} options
	 * @returns {RSVP.Promise} Resolves with the updated shader or null if removed
	 */
	ShaderHandler.prototype._update = function(ref, config, options) {
		if (!config) {
			this._remove(ref);
			return PromiseUtil.createDummyPromise();
		}
		if(!config.vshaderRef) {
			return PromiseUtil.createDummyPromise(null, 'Shader error, missing vertex shader ref');
		}
		if(!config.fshaderRef) {
			return PromiseUtil.createDummyPromise(null, 'Shader error, missing fragment shader ref');
		}

		var promises = [
			this.loadObject(config.vshaderRef, options),
			this.loadObject(config.fshaderRef, options)
		];

		return RSVP.all(promises).then(function(shaders) {
			var vshader = shaders[0];
			var fshader = shaders[1];

			if (!vshader) {
				return PromiseUtil.createDummyPromise(null, 'Vertex shader', config.vshaderRef, 'in shader', ref, 'not found');
			}
			if (!fshader) {
				return PromiseUtil.createDummyPromise(null, 'Fragment shader', config.fshaderRef, 'in shader', ref, 'not found');
			}

			var shaderDefinition = {
				defines: config.defines || {},
				attributes: config.attributes || {},
				uniforms: config.uniforms || {},
				vshader: vshader,
				fshader: fshader
			};

			if (config.processors) {
				shaderDefinition.processors = [];
				for (var i = 0; i < config.processors.length; i++) {
					var processor = config.processors[i];
					if (ShaderBuilder[processor]) {
						shaderDefinition.processors.push(ShaderBuilder[processor].processor);
					} else {
						console.error('Unknown processor ' + processor);
					}
				}
			}
			return Material.createShader(shaderDefinition, ref);
		});
	};

	return ShaderHandler;
});
