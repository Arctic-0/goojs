define([
	'goo/entities/components/Component',
	'goo/renderer/Material'
],
	/** @lends */
	function (
		Component,
		Material
	) {
	'use strict';

	/**
	 * @class Defines the appearance of a mesh, through materials. Using several materials results in multi-pass rendering.
	 * @extends Component
	 */
	function MeshRendererComponent(materials) {
		this.type = 'MeshRendererComponent';

		//! schteppe: Don't chain or nest ternary operators as it hard to read and confusing
		/** Materials to use when rendering
		 * @type {Material[]}
		 */
		this.materials = Array.isArray(materials) ? materials : materials ? [materials] : [];
		/** Worldspace bounding considering entity transformations
		 * @type {BoundingVolume}
		 */
		this.worldBound = null;

		/** Culling mode. Other valid values: 'Never'
		 * @type {string}
		 * @default
		 */
		this.cullMode = 'Dynamic'; //'Dynamic', 'Never'
		/**
		 * @type {boolean}
		 * @default
		 */
		this.castShadows = true;
		/**
		 * @type {boolean}
		 * @default
		 */
		this.receiveShadows = true;

		/**
		 * @type {boolean}
		 * @default
		 */
		this.isPickable = true;

		/**
		 * @type {boolean}
		 * @default
		 */
		this.isReflectable = true;

		/**
		 * @type {boolean}
		 * @default
		 */
		this.hidden = false;

		this.api = {
			setDiffuse: function () {
				if (!this.materials[0].uniforms.materialDiffuse) {
					this.materials[0].uniforms.materialDiffuse = [0, 0, 0, 1];
				}
				var diffuse = this.materials[0].uniforms.materialDiffuse;

				//! AT: need to search for a pattern matching library; this is just ugly and unmaintainable
				if (arguments.length >= 3) {
					diffuse[0] = arguments[0];
					diffuse[1] = arguments[1];
					diffuse[2] = arguments[2];
					diffuse[3] = arguments.length === 3 ? 1 : arguments[3];
				} else {
					var arg = arguments[0];
					if (arg instanceof Array) {
						diffuse[0] = arg[0];
						diffuse[1] = arg[1];
						diffuse[2] = arg[2];
						diffuse[3] = arg.length === 3 ? 1 : arg[3];
					} else if (arg.r !== undefined && arg.g !== undefined && typeof arg.b !== undefined) {
						diffuse[0] = arg.r;
						diffuse[1] = arg.g;
						diffuse[2] = arg.b;
						diffuse[3] = arg.a === undefined ? 1 : arg.a;
					}
				}
			}.bind(this),
			getDiffuse: function () {
				return this.materials[0].uniforms.materialDiffuse;
			}.bind(this)
		};
	}

	MeshRendererComponent.prototype = Object.create(Component.prototype);
	MeshRendererComponent.prototype.constructor = MeshRendererComponent;

	/**
	 * Update world bounding
	 *
	 * @param {BoundingVolume} bounding Bounding volume in local space
	 * @param {Transform} transform Transform to apply to local bounding -> world bounding
	 */
	MeshRendererComponent.prototype.updateBounds = function (bounding, transform) {
		this.worldBound = bounding.transform(transform, this.worldBound);
	};

	MeshRendererComponent.applyOnEntity = function(obj, entity) {
		var meshRendererComponent = entity.meshRendererComponent;

		if (!meshRendererComponent) {
			meshRendererComponent = new MeshRendererComponent();
		}

		// or a texture
		// or a {r, g, b} object
		var matched = false;
		if (obj instanceof Material) {
			meshRendererComponent.materials.push(obj);
			matched = true;
		}

		if (matched) {
			entity.setComponent(meshRendererComponent);
			return true;
		}
	};

	return MeshRendererComponent;
});
