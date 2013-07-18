define(['goo/animation/clip/AbstractAnimationChannel', 'goo/animation/clip/TriggerData'],
/** @lends */
function (AbstractAnimationChannel, TriggerData) {
	"use strict";

	/**
	 * @class An animation source channel consisting of keyword samples indicating when a specific trigger condition is met. Each channel can only be
	 *        in one keyword "state" at a given moment in time.
	 * @param {string} channelName the name of this channel.
	 * @param {number[]} times the time samples
	 * @param {string[]} keys our key samples. Entries may be null. Should have as many entries as the times array.
	 */
	function TriggerChannel (channelName, times, keys, blendType) {
		AbstractAnimationChannel.call(this, channelName, times, blendType);
		this._keys = keys ? keys.slice(0) : null;
		this.guarantee = false;
	}

	TriggerChannel.prototype = Object.create(AbstractAnimationChannel.prototype);

	// Was: function (instance)
	TriggerChannel.prototype.createStateDataObject = function () {
		return new TriggerData();
	};

	TriggerChannel.prototype.setCurrentSample = function (sampleIndex, progressPercent, triggerData) {
		var oldIndex = triggerData._currentIndex;

		var newIndex = progressPercent !== 1.0 ? sampleIndex : sampleIndex + 1;

		if (oldIndex === newIndex || !this.guarantee) {
			triggerData.arm(newIndex, [this._keys[newIndex]]);
		} else {
			var triggers = [];
			if (oldIndex > newIndex) {
				for (var i = oldIndex + 1; i < this._keys.length; i++) {
					triggers.push(this._keys[i]);
				}
				oldIndex = -1;
			}
			for ( var i = oldIndex + 1; i <= newIndex; i++) {
				triggers.push(this._keys[i]);
			}
			triggerData.arm(newIndex, triggers);
		}
	};

	return TriggerChannel;
});