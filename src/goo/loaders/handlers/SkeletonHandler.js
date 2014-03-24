define([
	'goo/loaders/handlers/ConfigHandler',
	'goo/animation/Joint',
	'goo/animation/Skeleton',
	'goo/animation/SkeletonPose',
	'goo/util/PromiseUtil',
	'goo/util/ObjectUtil'
],
/** @lends */
function(
		ConfigHandler,
		Joint,
		Skeleton,
		SkeletonPose,
		pu,
		_
) {
	"use strict";

	/**
	 * @class Handler for loading skeletons into engine
	 * @extends ConfigHandler
	 * @param {World} world
	 * @param {Function} getConfig
	 * @param {Function} updateObject
	 * @private
	 */
	function SkeletonHandler() {
		ConfigHandler.apply(this, arguments);
	}

	SkeletonHandler.prototype = Object.create(ConfigHandler.prototype);
	SkeletonHandler.prototype.constructor = SkeletonHandler;
	ConfigHandler._registerClass('skeleton', SkeletonHandler);

	/**
	 * Adds/updates/removes a skeleton. A Skeleton is created once and then reused, but skeletons
	 * are rarely updated.
	 * @param {string} ref
	 * @param {object|null} config
	 * @param {object} options
	 * @returns {RSVP.Promise} Resolves with the updated entity or null if removed
	 */
	SkeletonHandler.prototype._update = function(ref, config/*, options*/) {
		if (!this._objects[ref]) {
			if (!config) {
				return pu.createDummyPromise();
			}
			var joints = [];
			_.forEach(config.joints, function(jointConfig) {
				var joint = new Joint(jointConfig.name);
				joint._index = jointConfig.index;
				joint._parentIndex = jointConfig.parentIndex;
				joint._inverseBindPose.matrix.data.set(jointConfig.inverseBindPose);

				joints.push(joint);
			}, null, 'index');

			var skeleton = new Skeleton(config.name, joints);
			var pose = new SkeletonPose(skeleton);
			pose.setToBindPose();
			this._objects[ref] = pose;
		}

		return pu.createDummyPromise(this._objects[ref]);
	};

	return SkeletonHandler;
});
