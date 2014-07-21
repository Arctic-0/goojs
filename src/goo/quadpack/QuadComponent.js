define([
	'goo/entities/components/Component',
	'goo/renderer/MeshData',
	'goo/quadpack/DoubleQuad',
	'goo/entities/components/MeshDataComponent',
	'goo/entities/components/MeshRendererComponent',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Material',
	'goo/util/ObjectUtil',
	'goo/renderer/Texture'
],
/** @lends */
function (
	Component,
	MeshData,
	DoubleQuad,
	MeshDataComponent,
	MeshRendererComponent,
	ShaderLib,
	Material,
	_,
	Texture
) {
	'use strict';

	/**
	 * @class Quad component that holds a unit [Quad]{@link Quad} mesh and a [Material]{@link Material}. It makes it easy to create a textured quad in 3D space, for example a logotype. When the component is added to the world, all other needed components are automatically added to the entity. Make sure your add a [QuadSystem]{@link QuadSystem} to the world before you start using this component.
	 * @see QuadSystem
	 * @param {HTMLImageElement} [image]
	 * @param {object} [settings]
	 * @param {number} [settings.width=1]	Width of the Quad mesh. See [Quad]{@link Quad}
	 * @param {number} [settings.height=1]
	 * @param {number} [settings.tileX=1]	Number of tiles in the Quad. See [Quad]{@link Quad}
	 * @param {number} [settings.tileY=1]
	 * @param {number} [settings.preserveAspectRatio=true] Will resize the Quad mesh so that the aspect is preserved.
	 * @extends {Component}
	 * @example <caption>{@linkplain http://code.gooengine.com/latest/visual-test/goo/quadpack/QuadComponent/QuadComponent-vtest.html Working example}</caption>
	 */
	function QuadComponent(image, settings) {
		settings = settings || {};
		var defaults = {
			width	: 1,
			height	: 1,
			tileX	: 1,
			tileY	: 1,
			preserveAspectRatio : true
		};
		_.defaults(settings, defaults); //! AT: this will mutate settings which is BAD!!!

		this.type = 'QuadComponent';

		/**
		 * The width of the component in 3D space
		 */
		this.width = settings.width;

		/**
		 * The height of the component in 3D space
		 */
		this.height = settings.height;

		/**
		 * Tiling in x direction
		 */
		this.tileX = settings.tileX;

		/**
		 * Tiling in y direction
		 */
		this.tileY = settings.tileY;

		/**
		 * Whether to preserve aspect ratio or not. If this property is true, the component will have a maximum dimension of 1 in the 3D space.
		 */
		this.preserveAspectRatio = settings.preserveAspectRatio;

		/** Mesh renderer component that this component creates and adds to the entity.
		 * @type {MeshRendererComponent}
		 * @private
		 */
		this.meshRendererComponent = new MeshRendererComponent();

		/** The material currently used by the component.
		 * @type {Material}
		 */
		this.material = new Material(ShaderLib.uber, 'QuadComponent default material');

		/** The quad meshdata.
		 * @type {Quad}
		 * @private
		 */
		this.meshData = new DoubleQuad(settings.width, settings.height, settings.tileX, settings.tileY);

		/** Mesh data component that this component creates and adds to the entity.
		 * @type {MeshDataComponent}
		 * @private
		 */
		this.meshDataComponent = new MeshDataComponent(this.meshData);

		// Set the material as current
		var material = this.material;
		material.blendState.blending = 'CustomBlending';	// Needed if the quad has transparency
		material.renderQueue = 2000;
		material.uniforms.discardThreshold = 0.1;
		this.setMaterial(material);

		if (image) {
			var texture = new Texture(image);
			texture.anisotropy = 16;
			texture.wrapS = 'EdgeClamp';
			texture.wrapT = 'EdgeClamp';
			material.setTexture('DIFFUSE_MAP', texture);
		}

		this.rebuildMeshData();
	}
	QuadComponent.prototype = Object.create(Component.prototype);
	QuadComponent.prototype.constructor = QuadComponent;

	QuadComponent.prototype.attached = function (entity) {
		entity.setComponent(entity.quadComponent.meshRendererComponent);
		entity.setComponent(entity.quadComponent.meshDataComponent);
	};

	QuadComponent.prototype.detached = function (entity) {
		entity.clearComponent('meshRendererComponent');
		entity.clearComponent('meshDataComponent');
	};

	QuadComponent.prototype.destroy = function (context) {
		this.meshData.destroy(context);
	};

	/**
	 * Set the current material for the quad
	 * @param Material material
	 */
	QuadComponent.prototype.setMaterial = function (material) {
		this.material = material;
		this.meshRendererComponent.materials = [material];
		// REVIEW: Don't set this stuff here, set it in the data model
	};

	/**
	 * Re-build the meshData for the meshDataComponent.
	 */
	QuadComponent.prototype.rebuildMeshData = function () {
		var material = this.material;

		// Resize so it keeps aspect ratio
		var texture = material.getTexture('DIFFUSE_MAP');
		if (!texture) {
			return;
		}

		var image = texture.image;
		if (!image) {
			return;
		}

		if (this.preserveAspectRatio && image) {
			var height = image.svgHeight || image.height;
			var width = image.svgWidth || image.width;

			this.width = width / 100;
			this.height = height / 100;
		}

		var md = this.meshData;
		md.xExtent = this.width * 0.5;
		md.yExtent = this.height * 0.5;
		md.tileX = this.tileX;
		md.tileY = this.tileY;
		this.meshData.rebuild();
	};

	return QuadComponent;
});

