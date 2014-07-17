define([
	'goo/entities/systems/System'
],
/** @lends */
function (System) {
	'use strict';

	var numUpdates;

	/**
	 * @class Processes all entities with transform components, making sure they are up to date and valid according to the "scenegraph"
	 * {@linkplain http://127.0.0.1:8003/goojs/visual-test/goo/entities/components/TransformComponent/TransformComponent-vtest.html Working example}
	 * @extends System
	 */
	function TransformSystem() {
		System.call(this, 'TransformSystem', ['TransformComponent']);
		this.numUpdates = 0;
	}

	TransformSystem.prototype = Object.create(System.prototype);

	TransformSystem.prototype.process = function (entities) {
		numUpdates = 0;
		var i, transformComponent;
		for (i = 0; i < entities.length; i++) {
			transformComponent = entities[i].transformComponent;
			transformComponent._updated = false;
			if (transformComponent._dirty) {
				transformComponent.updateTransform();
			}
		}

		// Traverse from root nodes and down, depth first
		for (i = 0; i < entities.length; i++) {
			var entity = entities[i];
			transformComponent = entity.transformComponent;
			if (transformComponent.parent === null) {
				entity.traverse(traverseFunc);
			}
		}

		this.numUpdates = numUpdates;
	};

	function traverseFunc(entity) {
		if (entity.transformComponent._dirty) {
			entity.transformComponent.updateWorldTransform();
			numUpdates++;
			// Set children to dirty
			var children = entity.transformComponent.children;
			for (var j = 0; j < children.length; j++) {
				children[j]._dirty = true;
			}
		}
	}

	return TransformSystem;
});