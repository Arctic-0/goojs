define([
	'goo/entities/managers/Manager',
	'goo/entities/EntitySelection'
	],
	/** @lends */
	function (
		Manager,
		EntitySelection
	) {
	'use strict';

	/**
	 * @class Main handler of all entities in the world.
	 */
	function EntityManager() {
		this.type = 'EntityManager';

		this._entitiesById = {};
		this._entitiesByIndex = {};
		this._entityCount = 0;

		/** Entity selector. Its methods return an {@link EntitySelection}. Can select by id or name, see examples for usage.
		 * <br><i>Injected into {@link World}.</i>
		 * @member by
		 * @memberOf EntityManager.prototype
		 * @example
		 * var byId = gooRunner.world.by.id("2b88941938444da8afab8205b1c80616.entity").first();
		 * var byName = gooRunner.world.by.name("Box").first();
		 *
		 */

		this.api = {

			id: function () {
				var ret = EntityManager.prototype.getEntityById.apply(this, arguments);
				return new EntitySelection(ret); // just entity
			}.bind(this),
			name: function () {
				var ret = EntityManager.prototype.getEntityByName.apply(this, arguments);
				return new EntitySelection(ret); // just entity
			}.bind(this)
		};
	}

	EntityManager.prototype = Object.create(Manager.prototype);

	EntityManager.prototype.added = function (entity) {
		if (!this.containsEntity(entity)) {
			this._entitiesById[entity.id] = entity;
			this._entitiesByIndex[entity._index] = entity;
			this._entityCount++;
		}
	};

	EntityManager.prototype.removed = function (entity) {
		if (this.containsEntity(entity)) {
			delete this._entitiesById[entity.id];
			delete this._entitiesByIndex[entity._index];
			this._entityCount--;
		}
	};

	/**
	 * Checks if an entity exists
	 *
	 * @param entity Entity to check for
	 * @returns {Boolean} true if the entity exists
	 */
	EntityManager.prototype.containsEntity = function (entity) {
		return this._entitiesById[entity.id] !== undefined;
	};

	/**
	 * Retrieve an entity based on an id
	 *
	 * @param id Id to retrieve entity for
	 * @returns Entity or undefined if not existing
	 */
	EntityManager.prototype.getEntityById = function (id) {
		return this._entitiesById[id];
	};

	/**
	 * Retrieve an entity based on an id
	 *
	 * @param id Id to retrieve entity for
	 * @returns Entity or undefined if not existing
	 */
	EntityManager.prototype.getEntityByIndex = function (index) {
		return this._entitiesByIndex[index];
	};


	/**
	 * Retrieve an entity based on its name
	 *
	 * @param name Name to retrieve entity for
	 * @returns Entity or undefined if not existing
	 */
	EntityManager.prototype.getEntityByName = function (name) {
		for(var i in this._entitiesById) {
			var entity = this._entitiesById[i];
			if (entity.name === name) {
				return entity;
			}
		}
	};

	/**
	 * Get the number of entities currently indexed by the Entity Manager
	 *
	 * @returns {number}
	 */
	EntityManager.prototype.size = function () {
		return this._entityCount;
	};

	/**
	 * Get all entities in the world
	 *
	 * @returns {Array} Array containing all entities in the world
	 */
	//! AT: this need to return an EntitySelection object
	EntityManager.prototype.getEntities = function () {
		var entities = [];
		for(var i in this._entitiesById) {
			entities.push(this._entitiesById[i]);
		}
		return entities;
	};

	/**
	 * Get all entities on top level based on the transform scenegraph
	 *
	 * @returns {Array} Array containing all top entities
	 */
	EntityManager.prototype.getTopEntities = function () {
		var entities = [];
		for (var i in this._entitiesById) {
			var entity = this._entitiesById[i];
			if (entity.transformComponent) {
				if (!entity.transformComponent.parent) {
					entities.push(entity);
				}
			} else {
				entities.push(entity);
			}
		}
		return entities;
	};

	return EntityManager;
});