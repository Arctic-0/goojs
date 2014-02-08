define([
	'goo/loaders/handlers/ComponentHandler',
	'goo/entities/components/MeshDataComponent',
	'goo/renderer/bounds/BoundingBox',
	'goo/util/ShapeCreatorMemoized',
	'goo/util/rsvp',
	'goo/util/PromiseUtil',
	'goo/util/ObjectUtil',
	'goo/util/StringUtil'
],
/** @lends */
function(
	ComponentHandler,
	MeshDataComponent,
	BoundingBox,
	ShapeCreatorMemoized,
	RSVP,
	pu,
	_,
	StringUtil
) {
	"use strict";

	/*
	 * @class For handling loading of meshdatacomponents
	 * @constructor
	 * @param {World} world The goo world
	 * @param {function} getConfig The config loader function. See {@see DynamicLoader._loadRef}.
	 * @param {function} updateObject The handler function. See {@see DynamicLoader.update}.
	 * @extends ComponentHandler
	 */	function MeshDataComponentHandler() {
		ComponentHandler.apply(this, arguments);
		this._type = 'MeshDataComponent';
	}

	MeshDataComponentHandler.prototype = Object.create(ComponentHandler.prototype);
	MeshDataComponentHandler.prototype.constructor = MeshDataComponentHandler;
	ComponentHandler._registerClass('meshData', MeshDataComponentHandler);

	/*
	 * Prepare component. Set defaults on config here.
	 * @param {object} config
	 * @returns {object}
	 * @private
	 */
	MeshDataComponentHandler.prototype._prepare = function(config) {
		return _.defaults(config, {
		});
	};

	/*
	 * Create meshdata component.
	 * @returns {MeshDataComponent} the created component object
	 * @private
	 */
	MeshDataComponentHandler.prototype._create = function() {
		return new MeshDataComponent();
	};

	/**
	 * Update engine meshdatacomponent object based on the config.
	 * @param {Entity} entity The entity on which this component should be added.
	 * @param {object} config
	 * @param {object} options
	 * @returns {RSVP.Promise} promise that resolves with the component when loading is done.
	 */
	 MeshDataComponentHandler.prototype.update = function(entity, config, options) {
		var that = this;
		return ComponentHandler.prototype.update.call(this, entity, config, options).then(function(component) {
			if (config.shape) {
				var shapeCreator = ShapeCreatorMemoized['create' + StringUtil.capitalize(config.shape)];
				if (shapeCreator) {
					component.meshData = shapeCreator(config.shapeOptions, component.meshData);
					component.autoCompute = true;
					return component;
				}
			} else if (config.meshRef) {
				var promises = [];
				// MeshData
				promises.push(that._load(config.meshRef, options).then(function(meshData) {
					component.meshData = meshData;
					if (meshData.boundingBox) {
						var min = meshData.boundingBox.min;
						var max = meshData.boundingBox.max;
						var size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
						var center = [(max[0] + min[0]) * 0.5, (max[1] + min[1]) * 0.5, (max[2] + min[2]) * 0.5];
						var bounding = new BoundingBox();
						bounding.xExtent = size[0] / 2;
						bounding.yExtent = size[1] / 2;
						bounding.zExtent = size[2] / 2;
						bounding.center.seta(center);
						component.modelBound = bounding;
						component.autoCompute = false;
					}
				}));
				// Skeleton pose
				if (config.poseRef) {
					promises.push(that._load(config.poseRef, options).then(function(pose) {
						component.currentPose = pose;
					}));
				} else {
					component.currentPose = null;
				}
				return RSVP.all(promises).then(function() {
					return component;
				});
			}
		});
	};

	return MeshDataComponentHandler;
});
