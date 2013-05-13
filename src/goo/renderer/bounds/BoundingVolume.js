define([
	'goo/math/Vector3'
],
/** @lends */
function(
	Vector3
) {
	"use strict";

	/**
	 * @class <code>BoundingVolume</code> Base class for boundings
	 */
	function BoundingVolume() {
		this.center = new Vector3();

		this.min = new Vector3(Infinity, Infinity, Infinity);
		this.max = new Vector3(-Infinity, -Infinity, -Infinity);
	}

	/**
	 * Intersection type
	 */
	BoundingVolume.Outside = 0;
	BoundingVolume.Inside = 1;
	BoundingVolume.Intersects = 2;

	return BoundingVolume;
});