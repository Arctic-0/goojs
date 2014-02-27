define([
	'goo/loaders/handlers/ConfigHandler',
	'goo/renderer/Material',
	'goo/renderer/Util',
	'goo/renderer/shaders/ShaderLib',
	'goo/util/rsvp',
	'goo/util/PromiseUtil',
	'goo/util/ObjectUtil'
],
/** @lends */
function(
	ConfigHandler,
	Material,
	Util,
	ShaderLib,
	RSVP,
	PromiseUtil,
	_
) {
	"use strict";

	/**
	 * @class Handler for loading materials into engine
	 * @extends ConfigHandler
	 * @param {World} world
	 * @param {Function} getConfig
	 * @param {Function} updateObject
	 * @private
	 */
	function MaterialHandler() {
		ConfigHandler.apply(this, arguments);
	}

	MaterialHandler.prototype = Object.create(ConfigHandler.prototype);
	MaterialHandler.prototype.constructor = MaterialHandler;
	ConfigHandler._registerClass('material', MaterialHandler);

	MaterialHandler.ENGINE_SHADER_PREFIX = "GOO_ENGINE_SHADERS/";

	/**
	 * Preparing material config by populating it with defaults.
	 * @param {object} config
	 * @private
	 */
	MaterialHandler.prototype._prepare = function(config) {
		if (!config.blendState) {
			config.blendState = {};
		}
		_.defaults(config.blendState, {
			blending: 'NoBlending',
			blendEquation: 'AddEquation',
			blendSrc: 'SrcAlphaFactor',
			blendDst: 'OneMinusSrcAlphaFactor'
		});

		if (!config.cullState) {
			config.cullState = {};
		}
		_.defaults(config.cullState, {
			enabled: true,
			cullFace: 'Back',
			frontFace: 'CCW'
		});

		if (!config.depthState) {
			config.depthState = {};
		}
		_.defaults(config.depthState, {
			enabled: true,
			write: true
		});

		if (config.renderQueue === null || config.renderQueue === undefined) {
			config.renderQueue = -1;
		}
		if (config.dualTransparency === null || config.dualTransparency === undefined) {
			config.dualTransparency = false;
		}
		config.wireframe = false;
		config.flat = false;
	};

	/**
	 * Creates a (somewhat) empty material.
	 * @returns {Material}
	 * @private
	 */
	MaterialHandler.prototype._create = function() {
		return new Material();
	};

	/**
	 * Adds/updates/removes a a material
	 * @param {string} ref
	 * @param {object|null} config
	 * @param {object} options
	 * @returns {RSVP.Promise} Resolves with the updated material or null if removed
	 */
	MaterialHandler.prototype.update = function(ref, config, options) {
		var that = this;
		return ConfigHandler.prototype.update.call(this, ref, config, options).then(function(material) {
			if (!material) { return; }
			var promises = [];
			// Material settings
			_.extend(material.blendState, config.blendState);
			_.extend(material.cullState, config.cullState);
			_.extend(material.depthState, config.depthState);

			material.name = config.name;
			material.wireframe = config.wireframe;
			material.flat = config.flat;
			material.dualTransparency = config.dualTransparency;
			if (config.renderQueue === -1) {
				material.renderQueue = null;
			} else {
				material.renderQueue = config.renderQueue;
			}
			material.uniforms = {};
			for (var name in config.uniforms) {
				if (config.uniforms[name].enabled === undefined) {
					material.uniforms[name] = _.clone(config.uniforms[name]);
				} else if (config.uniforms[name].enabled) {
					material.uniforms[name] = _.clone(config.uniforms[name].value);
				}
			}

			// Shader
			if (config.wireframe) {
				material.shader = Material.createShader(ShaderLib.simple);
			} else {
				var shaderRef = config.shaderRef;
				if (!shaderRef) {
					material.shader = Material.createShader(ShaderLib.texturedLit, 'DefaultShader');
				}
				else if (shaderRef.indexOf(MaterialHandler.ENGINE_SHADER_PREFIX) === 0) {
					var shaderName = shaderRef.slice(MaterialHandler.ENGINE_SHADER_PREFIX.length);
					material.shader = Material.createShader(ShaderLib[shaderName]);
				} else {
					var p = that._load(shaderRef, options).then(function(shader) {
						material.shader = shader;
					}).then(null, function(err) {
						throw new Error('Error loading shader: ' + err);
					});
					promises.push(p);
				}
			}

			// Textures
			function addTexture(type, ref, options) {
				return that._load(ref, options).then(function(texture) {
					if (texture.image) {
						material.setTexture(type, texture);
					} else {
						material.removeTexture(type);
					}
				}).then(null, function(err) {
					throw new Error('Error loading texture: ' + ref + ' - ' + err);
				});
			}
			var textureRef;
			for (var type in config.texturesMapping) {
				textureRef = config.texturesMapping[type];
				if(!textureRef || !textureRef.textureRef || textureRef.enabled === false) {
					material.removeTexture(type);
				} else {
					promises.push(addTexture(type, textureRef.textureRef, options));
				}
			}
			for (var type in material._textureMaps) {
				if (!config.texturesMapping[type]) {
					material.removeTexture(type);
				}
			}
			return RSVP.all(promises).then(function() {
				return material;
			});
		});
	};

	return MaterialHandler;
});
