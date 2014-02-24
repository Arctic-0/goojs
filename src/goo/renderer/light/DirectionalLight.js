define([
		'goo/math/Vector3',
		'goo/renderer/light/Light'
		],
/** @lends */
function (
	Vector3,
	Light
	) {
	'use strict';

	/**
	 * @class A directional light
	 * @constructor
	 * @extends Light
	 * @param {Vector3} [color=(1, 1, 1)] The color of the light
	 */
	function DirectionalLight(color) {
		Light.call(this, color);

		/**
		 * The direction vector of the light
		 * @readonly
		 * @type {Vector3}
		 */
		this.direction = new Vector3();
	}

	DirectionalLight.prototype = Object.create(Light.prototype);
	DirectionalLight.prototype.constructor = DirectionalLight;

	/**
	 * Updates the light's translation and orientation
	 * @private
	 * @param transform
	 */
	DirectionalLight.prototype.update = function (transform) {
		transform.matrix.getTranslation(this.translation);
		this.direction.setd(0.0, 0.0, -1.0);
		transform.matrix.applyPostVector(this.direction);
	};

	return DirectionalLight;
});