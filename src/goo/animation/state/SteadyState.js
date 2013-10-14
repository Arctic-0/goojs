define(['goo/animation/state/AbstractState'],
/** @lends */
function (AbstractState) {
	"use strict";

	/**
	 * @class A "steady" state is an animation state that is concrete and stand-alone (vs. a state that handles transitioning between two states, for
	 *        example.)
	 * @extends AbstractState
	 * @param {string} name Name of state
	 */
	function SteadyState (name) {
		AbstractState.call(this);

		this._name = name;
		this._transitions = {};
		this._sourceTree = null;
	}

	SteadyState.prototype = Object.create(AbstractState.prototype);

	/*
	 * Updates the states clip instances
	 */
	SteadyState.prototype.update = function (globalTime) {
		if (!this._sourceTree.setTime(globalTime)) {
			if(this.onFinished) {
				this.onFinished();
			}
		}
	};

	/*
	 * Gets the current animation data, used in {@link AnimationLayer}
	 */
	SteadyState.prototype.getCurrentSourceData = function () {
		return this._sourceTree.getSourceData();
	};

	/*
	 * Resets the animationclips in the sourcetree
	 * @param {number} globalStartTime Usually current time
	 */
	SteadyState.prototype.resetClips = function (globalStartTime) {
		AbstractState.prototype.resetClips.call(this, globalStartTime);
		this._sourceTree.resetClips(globalStartTime);
	};

	SteadyState.prototype.setTimeScale = function (timeScale) {
		this._sourceTree.setTimeScale(timeScale);
	};
	return SteadyState;
});