define([
	'goo/fsmpack/statemachine/actions/Action',
	'goo/util/PromiseUtil'
], function (
	Action,
	PromiseUtil
) {
	'use strict';

	function PlaySoundAction(/*id, settings*/) {
		Action.apply(this, arguments);
	}

	PlaySoundAction.prototype = Object.create(Action.prototype);
	PlaySoundAction.prototype.constructor = PlaySoundAction;

	PlaySoundAction.external = {
		name: 'Play Sound',
		type: 'sound',
		description: 'Plays a sound.',
		canTransition: true,
		parameters: [{
			name: 'Sound',
			key: 'sound',
			type: 'sound',
			description: 'Sound to play.',
			'default': 0
		}],
		transitions: [{
			key: 'complete',
			description: 'State to transition to when the sound finishes playing.'
		}]
	};

	var labels = {
		complete: 'On Sound End'
	};

	PlaySoundAction.getTransitionLabel = function(transitionKey /*, actionConfig*/){
		return labels[transitionKey];
	};

	PlaySoundAction.prototype.enter = function (fsm) {
		var entity = fsm.getOwnerEntity();

		if (!entity.hasComponent('SoundComponent')) { return; }

		var sound = entity.soundComponent.getSoundById(this.sound);
		if (!sound) { return; }

		var endPromise;
		try {
			endPromise = sound.play();
		} catch (e) {
			console.warn('Could not play sound: ' + e);
			endPromise = PromiseUtil.resolve();
		}

		endPromise.then(function () {
			fsm.send(this.transitions.complete);
		}.bind(this));
	};

	return PlaySoundAction;
});