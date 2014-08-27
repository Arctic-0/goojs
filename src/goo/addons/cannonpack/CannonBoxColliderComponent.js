define([
	'goo/entities/components/Component',
	'goo/shapes/Box',
	'goo/math/Vector3'
],
/** @lends */
function (
	Component,
	Box,
	Vector3
) {
	'use strict';

	/* global CANNON */

	/**
	 * @class Physics box collider for Cannon.js. To be attached to an entity with a {@link CannonRigidbodyComponent}. Also see the {@link CannonSystem}.<br>
	 * {@linkplain http://code.gooengine.com/latest/visual-test/goo/addons/Cannon/Cannon-vtest.html Working example}
	 * @param {object} [settings]
	 * @param {Vector3} [settings.halfExtents] The half-extents of the box collider.
	 * @extends Component
	 */
	function CannonBoxColliderComponent(settings) {
		this.type = 'CannonBoxColliderComponent';

		settings = settings || {};
		var e = this.halfExtents = settings.halfExtents || new Vector3(0.5, 0.5, 0.5);

		// Create shape
		this.cannonShape = new CANNON.Box(new CANNON.Vec3(e.x, e.y, e.z));
	}

	CannonBoxColliderComponent.prototype = Object.create(Component.prototype);
	CannonBoxColliderComponent.constructor = CannonBoxColliderComponent;

	return CannonBoxColliderComponent;
});
