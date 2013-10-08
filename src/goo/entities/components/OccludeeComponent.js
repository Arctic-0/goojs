define([
	'goo/entities/components/Component',
	'goo/renderer/bounds/BoundingBox',
	'goo/renderer/bounds/BoundingSphere'
],
	/** @lends */
		function (Component, BoundingBox, BoundingSphere) {
		"use strict";

		/**
		 * @class
		 * @param meshData
		 * @param useBoundingBox
		 * @constructor
		 */
		function OccludeeComponent(meshData, useBoundingBox) {
			Component.call(this, 'OccludeeComponent', false);

			if (useBoundingBox === true){
				this.modelBound = new BoundingBox();
			} else {
				this.modelBound = new BoundingSphere();
			}

			var verts = meshData.getAttributeBuffer('POSITION');
			if (verts !== undefined) {
				this.modelBound.computeFromPoints(verts);
			}

			this.positionArray = new Float32Array(4 * 8);

			if (useBoundingBox === true) {
				// Create the 8 vertices which create the bounding box.
				var x = this.modelBound.xExtent;
				var y = this.modelBound.yExtent;
				var z = this.modelBound.zExtent;

				// Create the array in one call.
				this.positionArray.set([
					-x, y, -z, 1.0,
					-x, y, z, 1.0,
					x, y, z, 1.0,
					x, y, -z, 1.0,
					-x, -y, -z, 1.0,
					-x, -y, z, 1.0,
					x, -y, z, 1.0,
					x, -y, -z, 1.0
				]);
			}
		}

		OccludeeComponent.prototype = Object.create(Component.prototype);

		return OccludeeComponent;
	});