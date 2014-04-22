define([
	'goo/entities/components/Component',
	'goo/entities/SystemBus',
	'goo/scripts/Scripts',
	'goo/util/ObjectUtil',
	'goo/scripts/ScriptRegister'
],
/** @lends */
function (
	Component,
	SystemBus,
	Scripts,
	_
) {
	'use strict';

	/**
	 * @class Contains scripts to be executed each frame when set on an active entity.
	 * @param {object[]|object} [scripts] A script-object or an array of script-objects to attach to the entity.
	 * The script-object needs to define the function <code>run({@link Entity} entity, number tpf)</code>.
	 * @extends Component
	 */
	function ScriptComponent(scripts) {
		this.type = 'ScriptComponent';
		this._gooClasses = Scripts.getClasses();

		if (scripts instanceof Array) {
			this.scripts = scripts;
		} else if (scripts) {
			this.scripts = [scripts];
		} else {
			/**
			* Array of scripts tied to this script component. Scripts can be added to the component 
			* using the constructor or by manually adding to the array.
			* @type {object[]}
			* @example
			* // Add a script to script component
			* var scriptComponent = new ScriptComponent();
			* var controlScript = new WASDControlScript();
			* scriptComponent.scripts.push(controlScript);
			*/
			this.scripts = [];
		}
	}

	ScriptComponent.prototype = Object.create(Component.prototype);
	ScriptComponent.prototype.constructor = ScriptComponent;

	/**
	 * Runs the .setup method on each script; called when the ScriptComponent is attached to the entity or when the entity is added to the world.
	 * @private
	 * @param entity
	 */
	ScriptComponent.prototype.setup = function (entity) {
		var systemContext = entity._world.getSystem('ScriptSystem').context;
		var componentContext = Object.create(systemContext);
		_.extend(componentContext, {
			entity: entity,
			entityData: {}
		});

		for (var i = 0; i < this.scripts.length; i++) {
			var script = this.scripts[i];
			var scriptContext = Object.create(componentContext);

			script.context = scriptContext;

			if (script.setup) {
				try {
					script.setup(script.parameters, script.context, this._gooClasses);
					if (script.parameters && script.parameters.enabled !== undefined) {
						script.enabled = script.parameters.enabled;
					} else {
						script.enabled = true;
					}
				} catch(e) {
					script.enabled = false;
					SystemBus.emit('goo.scriptError', {
						message: e.message || e,
						phase: 'setup',
						scriptName: script.name || script.externals.name
					});
				}
			}
		}
	};

	/**
	 * Called when script component is attached to entity.
	 * @private
	 * @type {setup}
	 */
	//ScriptComponent.prototype.attached = ScriptComponent.prototype.setup;

	/**
	 * Runs the update function on every script attached to this entity.
	 * @private
	 * @param entity {Entity}
	 * @param tpf {number}
	 * @param context
	 */
	ScriptComponent.prototype.run = function (entity) {
		for (var i = 0; i < this.scripts.length; i++) {
			var script = this.scripts[i];
			if (script && script.run && (script.enabled === undefined || script.enabled)) {
				try {
					script.run(entity, entity._world.tpf, script.context, script.parameters);
				} catch (e) {}
			} else if (script.update && (script.enabled === undefined || script.enabled)) {
				try {
					script.update(script.parameters, script.context, this._gooClasses);
				} catch (e) {
					script.enabled = false;
					SystemBus.emit('goo.scriptError', {
						message: e.message || e,
						scriptName: script.name || script.externals.name,
						phase: 'run'
					});
				}
			}
		}
	};

	/**
	 * Reverts any changes done by setup; called when the entity loses its ScriptComponent or is removed from the world.
	 * @private
	 */
	ScriptComponent.prototype.cleanup = function () {
		for (var i = 0; i < this.scripts.length; i++) {
			var script = this.scripts[i];
			if (script.context && script.cleanup) {
				try {
					script.cleanup(script.parameters, script.context, this._gooClasses);
				} catch (e) {
					SystemBus.emit('goo.scriptError', {
						message: e.message || e,
						scriptName: script.name || script.externals.name,
						phase: 'cleanup'
					});
				}
				script.enabled = false;
			}
		}
	};

	/**
	 * Called when script component is detached from entity.
	 * @private
	 * @type {setup}
	 */
	//ScriptComponent.prototype.detached = ScriptComponent.prototype.cleanup;

	/**
	 * Attempts to add a script to an entity. The object can be a { run: Function } object or a Function. The entity is supposed to get a ScriptComponent with a script created out of the passed object
	 * @private
	 * @param obj {Function | { run: Function }}
	 * @param entity {Entity}
	 * @returns {boolean}
	 */
	ScriptComponent.applyOnEntity = function (obj, entity) {
		if (obj instanceof Function || (obj && obj.run instanceof Function) || (obj && obj.update instanceof Function)) {
			var scriptComponent;
			if (!entity.scriptComponent) {
				scriptComponent = new ScriptComponent();
				entity.setComponent(scriptComponent);
			} else {
				scriptComponent = entity.scriptComponent;
			}
			scriptComponent.scripts.push(obj.run instanceof Function || obj.update instanceof Function ? obj : { run: obj });

			return true;
		}
	};

	return ScriptComponent;
});