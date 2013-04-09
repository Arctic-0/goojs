define([
	'goo/renderer/MeshData'],
/** @lends */

function(
MeshData) {
	"use strict";

	/**
	 * @class An axis-aligned rectangular prism defined by a center point and x-, y- and z-extents (radii) from that center.
	 * @property {Float} xExtent Extent along the local x axis.
	 * @property {Float} yExtent Extent along the local y axis.
	 * @property {Float} zExtent Extent along the local z axis.
	 * @constructor
	 * @description Creates a new box.
	 * @param {Float} width Total width of box.
	 * @param {Float} height Total height of box.
	 * @param {Float} length Total length of box.
	 */

	function SimpleBox(width, height, length) {
		this.xExtent = width !== undefined ? width * 0.5 : 0.5;
		this.yExtent = height !== undefined ? height * 0.5 : 0.5;
		this.zExtent = length !== undefined ? length * 0.5 : 0.5;

		var attributeMap = MeshData.defaultMap([MeshData.POSITION]);
		MeshData.call(this, attributeMap, 8, 36);

		this.rebuild();
	}

	SimpleBox.prototype = Object.create(MeshData.prototype);

	/**
	 * @description Builds or rebuilds the mesh data.
	 * @returns {Box} Self for chaining.
	 */

	SimpleBox.prototype.rebuild = function() {
		var xExtent = this.xExtent;
		var yExtent = this.yExtent;
		var zExtent = this.zExtent;

		this.getAttributeBuffer(MeshData.POSITION).set([
			-xExtent, -yExtent, -zExtent,
			xExtent, -yExtent, -zExtent,
			xExtent, yExtent, -zExtent,
			-xExtent, yExtent, -zExtent,

			-xExtent, -yExtent, zExtent,
			xExtent, -yExtent, zExtent,
			xExtent, yExtent, zExtent,
			-xExtent, yExtent, zExtent
		]);

		this.getIndexBuffer().set([
			//front
			0, 1, 2, 2, 3, 0,
			//back
			7, 6, 5, 5, 4, 7,
			//left
			0, 3, 7, 7, 4, 0,
			//right
			1, 2, 6, 6, 5, 1,
			//top
			3, 2, 6, 6, 7, 3,
			//bottom
			0, 1, 5, 5, 4, 0
		]);

		return this;
	};

	return SimpleBox;
});