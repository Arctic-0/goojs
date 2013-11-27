define([
	'goo/entities/components/Component',
	'goo/entities/World',
	'goo/animation/layer/AnimationLayer',
	'goo/animation/clip/JointData',
	'goo/animation/clip/TransformData',
	'goo/animation/clip/TriggerData'
],
/** @lends */
function (
	Component,
	World,
	AnimationLayer,
	JointData,
	TransformData,
	TriggerData
) {
	"use strict";

	/**
	 * @class Holds the animation data.
	 */
	function AnimationComponent(pose) {
		/**
		 * @type {string}
		 * @readonly
		 * @default
		 */
		this.type = 'AnimationComponent';
		/**
		 * @type {AnimationLayer[]}
		 */
		this.layers = [];
		this.floats = {};

		this._updateRate = 1.0 / 60.0;
		this._lastUpdate = 0.0;
		this._triggerCallbacks = {};

		// Base layer
		var layer = new AnimationLayer(AnimationLayer.BASE_LAYER_NAME);
		this.layers.push(layer);
		this._skeletonPose = pose;

		this.paused = false;
		this.lastTimeOfPause = null;
		this.accumulatedDelay = 0;
	}

	AnimationComponent.prototype = Object.create(Component.prototype);

	/**
	 * Transition to another state. This is shorthand for applying transitions on the base layer, see {@link AnimationLayer.transitionTo} for more info
	 * @param {string} stateKey
	 * @returns {boolean} true if a transition was found and started
	 */
	AnimationComponent.prototype.transitionTo = function(stateKey) {
		return this.layers[0].transitionTo(stateKey);
	};
	/**
	 * Get available states
	 * returns {string[]} available state keys
	 */
	AnimationComponent.prototype.getStates = function() {
		return this.layers[0].getStates();
	};
	AnimationComponent.prototype.getCurrentState = function() {
		return this.layers[0].getCurrentState();
	};
	/**
	 * Get available transitions
	 * returns {string[]} available state keys
	 */
	AnimationComponent.prototype.getTransitions = function() {
		return this.layers[0].getTransitions();
	};

	/*
	 * Update animations
	 */
	AnimationComponent.prototype.update = function (globalTime) {
		if (this.paused) {
			return;
		}

		// grab current global time
		globalTime = globalTime || World.time;

		// check throttle
		if (this._updateRate !== 0.0) {
			if (globalTime > this._lastUpdate && globalTime - this._lastUpdate < this._updateRate) {
				return;
			}

			// we subtract a bit to maintain our desired rate, even if there are some gc pauses, etc.
			this._lastUpdate = globalTime - (globalTime - this._lastUpdate) % this._updateRate;
		}

		// move the time forward on the layers
		for ( var i = 0, max = this.layers.length; i < max; i++) {
			this.layers[i].update(globalTime);
		}
	};

	/*
	 * Applying calculated animations to the concerned data
	 */
	AnimationComponent.prototype.apply = function(transformComponent) {
		var data = this.getCurrentSourceData();
		var pose = this._skeletonPose;

		// cycle through, pulling out and applying those we know about
		if (data) {
			for ( var key in data) {
				var value = data[key];
				if (value instanceof JointData) {
					if (pose && value._jointIndex >= 0) {
						value.applyTo(pose._localTransforms[value._jointIndex]);
					}
				} else if (value instanceof TransformData) {
					if (transformComponent) {
						value.applyTo(transformComponent.transform);
						transformComponent.updateTransform();
						this._updateWorldTransform(transformComponent);
					}
				} else if (value instanceof TriggerData) {
					if (value.armed) {
						// pull callback(s) for the current trigger key, if exists, and call.
						// TODO: Integrate with GameMaker somehow
						for ( var i = 0, maxI = value._currentTriggers.length; i < maxI; i++) {
							var callbacks = this._triggerCallbacks[value._currentTriggers[i]];
							if (callbacks && callbacks.length) {
								for ( var j = 0, maxJ = callbacks.length; j < maxJ; j++) {
									callbacks[j]();
								}
							}
						}
						value.armed = false;
					}
				} else if (value instanceof Array) {
					this.floats[key] = value[0];
				}
			}
			if (pose) {
				pose.updateTransforms();
			}
		}
	};

	AnimationComponent.prototype._updateWorldTransform = function(transformComponent) {
		transformComponent.updateWorldTransform();

		for (var i = 0; i < transformComponent.children.length; i++) {
			this._updateWorldTransform(transformComponent.children[i]);
		}
	};

	/*
	 * Called after the animations are applied
	 */
	AnimationComponent.prototype.postUpdate = function() {
		// post update to clear states
		for ( var i = 0, max = this.layers.length; i < max; i++) {
			this.layers[i].postUpdate();
		}
	};

	/*
	 * Gets the current animation data for all layers blended together
	 */
	AnimationComponent.prototype.getCurrentSourceData = function () {
		// set up our layer blending.
		if (this.layers.length === 0) {
			return [];
		}
		var last = this.layers.length - 1;
		this.layers[0]._layerBlender = null;
		for ( var i = 0; i < last; i++) {
			this.layers[i + 1].updateLayerBlending(this.layers[i]);
		}
		return this.layers[last].getCurrentSourceData();
	};

	/**
	 * Add a new {@link AnimationLayer} to the stack
	 * @param {AnimationLayer} layer
	 * @param {number} [index] if no index is supplied, it's put on top of the stack
	 */
	AnimationComponent.prototype.addLayer = function (layer, index) {
		if (!isNaN(index)) {
			this.layers.splice(index, 0, layer);
		} else {
			this.layers.push(layer);
		}
	};

	AnimationComponent.prototype.resetClips = function(globalTime) {
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].resetClips(globalTime);
		}
	};

	AnimationComponent.prototype.shiftClipTime = function(shiftTime) {
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].shiftClipTime(shiftTime);
		}
	};

	AnimationComponent.prototype.setTimeScale = function(timeScale) {
		for (var i = 0; i < this.layers.length; i++) {
			this.layers[i].setTimeScale(timeScale);
		}
	};

	AnimationComponent.prototype.pause = function() {
		if (!this.paused) {
			this.lastTimeOfPause = World.time;
			this.paused = true;
		}
	};

	AnimationComponent.prototype.stop = function() {
		/*this.resetClips();
		this.paused = false;
		this.update();*/
		this.paused = true;
		this.lastTimeOfPause = -1;
	};

	AnimationComponent.prototype.resume = function() {
		if (this.paused) {
			if (this.lastTimeOfPause === -1) {
				this.resetClips();
			} else {
				this.shiftClipTime(World.time - this.lastTimeOfPause);
			}
			//this.accumulatedDelay += World.time - this.lastTimeOfPause;
			// console.log(this.accumulatedDelay); // rogue comment
		}
		this.paused = false;
	};

	return AnimationComponent;
});