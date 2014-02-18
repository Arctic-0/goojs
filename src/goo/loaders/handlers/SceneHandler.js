define([
	'goo/loaders/handlers/ConfigHandler',
	'goo/entities/SystemBus',
	'goo/util/ArrayUtil',
	'goo/util/ObjectUtil',
	'goo/util/rsvp'
],
/** @lends */
function(
	ConfigHandler,
	SystemBus,
	ArrayUtil,
	_,
	RSVP
) {
	"use strict";

	/**
	 * @class Handler for loading scene into engine
	 * @extends ConfigHandler
	 * @param {World} world
	 * @param {Function} getConfig
	 * @param {Function} updateObject
	 * @private
	 */
	function SceneHandler() {
		ConfigHandler.apply(this, arguments);
	}

	SceneHandler.prototype = Object.create(ConfigHandler.prototype);
	SceneHandler.prototype.constructor = SceneHandler;
	ConfigHandler._registerClass('scene', SceneHandler);

	/**
	 * Removes the scene, i e removes all entities in scene from engine world
	 * @param {ref}
	 */
	SceneHandler.prototype._remove = function(ref) {
		//Todo Clear engine
		var scene = this._objects[ref];
		if (scene) {
			for (var i = 0; i < scene.entities.length; i++) {
				scene.entities[i].removeFromWorld();
			}
		}
		// Remove posteffects
		// Remove environment

		delete this._objects[ref];
	};

	/**
	 * Creates an empty scene which will hold some scene data
	 * @returns {Entity}
	 * @private
	 */
	SceneHandler.prototype._create = function() {
		return {
			id: null,
			entities: {},
			posteffects: [],
			environment: null,
			initialCameraRef: null
		};
	};

	/**
	 * Creates/updates/removes a scene
	 * @param {string} ref
	 * @param {object|null} config
	 * @param {object} options
	 * @returns {RSVP.Promise} Resolves with the updated scene or null if removed
	 */
	SceneHandler.prototype.update = function(ref, config, options) {
		var that = this;
		return ConfigHandler.prototype.update.call(this, ref, config, options).then(function(scene) {
			scene.id = ref;
			var promises = [];
			promises.push(that._handleEntities(config, scene, options));
			if (config.posteffectsRef) {
				promises.push(that._load(config.posteffectsRef, options));
			}
			if (config.environmentRef) {
				promises.push(that._load(config.environmentRef, options));
			}
			if (config.initialCameraRef && config.initialCameraRef !== scene.initialCameraRef) {
				promises.push(that._load(config.initialCameraRef, options).then(function(cameraEntity) {
					if (cameraEntity && cameraEntity.cameraComponent) {
						SystemBus.emit('goo.setCurrentCamera', {
							camera: cameraEntity.cameraComponent.camera,
							entity: cameraEntity
						});
					}
					scene.initialCameraRef = config.initialCameraRef;
				}));
			}
			return RSVP.all(promises).then(function() {
				return scene;
			});
		});
	};

	/**
	 * Adding and removing entities to the engine and thereby the scene
	 * @param {object} config
	 * @param {object} scene
	 * @param {object} options
	 */
	SceneHandler.prototype._handleEntities = function(config, scene, options) {
		var promises = [];

		var addedEntityIds = _.clone(config.entityRefs);
		var removedEntityIds = [];

		for (var id in scene.entities) {
			var engineEntity = scene.entities[id];
			if (addedEntityIds[id]) {
				delete addedEntityIds[id];
			}
			else {
				removedEntityIds[id] = id;
			}
		}

		for (var key in addedEntityIds) {
			promises.push(this._load(config.entityRefs[key], options));
		}

		return RSVP.all(promises).then(function(entities) {
			// Adding new entities
			for (var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				entity.addToWorld();
				scene.entities[entity.id] = entity;
			}
			
			// Removing old entities
			// This is handled by EntityHandler
			// for (var id in removedEntityIds) {
			// 	var entity = scene.entities[id];
			// 	if (entity) {
			// 		entity.removeFromWorld();
			// 		delete scene.entities[id];
			// 	}
			// }
		});
	};

	/**
	 * Handling posteffects
	 * @param {object} config
	 * @param {object} scene
	 * @param {object} options
	 */
	SceneHandler.prototype._handlePosteffects = function(config, scene, options) {
		return this._load(config.posteffectsRef, options);
	};

	/**
	 * Handling environment, to be implemented
	 * @param {object} config
	 * @param {object} scene
	 * @param {object} options
	 */
	SceneHandler.prototype._handleEnvironment = function(config, scene, options) {
		return this._load(config.environmentRef, options);
	};

	return SceneHandler;

});
