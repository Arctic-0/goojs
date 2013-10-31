define([
	'goo/statemachine/actions/Action'
],
/** @lends */
function(
	Action
) {
	"use strict";

	function TweenTextureOffsetAction(/*id, settings*/) {
		Action.apply(this, arguments);
	}

	TweenTextureOffsetAction.prototype = Object.create(Action.prototype);
	TweenTextureOffsetAction.prototype.constructor = TweenTextureOffsetAction;

	TweenTextureOffsetAction.external = {
		name: 'Tween Texture Offset',
		description: 'Smoothly changes the texture offset of the entity',
		canTransition: true,
		parameters: [{
			name: 'X Offset',
			key: 'toX',
			type: 'number',
			min: 0,
			max: 1,
			description: 'X Offset',
			'default': 1
		}, {
			name: 'Y Offset',
			key: 'toY',
			type: 'number',
			min: 0,
			max: 1,
			description: 'Y Offset',
			'default': 1
		}, {
			name: 'Time',
			key: 'time',
			type: 'number',
			description: 'Time it takes for this transition to complete',
			'default': 1000
		}, {
			name: 'Easing type',
			key: 'easing1',
			type: 'dropdown',
			description: 'Easing type',
			'default': 'Linear',
			options: ['Linear', 'Quadratic', 'Exponential', 'Circular', 'Elastic', 'Back', 'Bounce']
		}, {
			name: 'Direction',
			key: 'easing2',
			type: 'dropdown',
			description: 'Easing direction',
			'default': 'In',
			options: ['In', 'Out', 'InOut']
		}],
		transitions: [{
			key: 'complete',
			name: 'On Completion',
			description: 'State to transition to when the transition completes'
		}]
	};

	TweenTextureOffsetAction.prototype.configure = function (settings) {
		this.toX = +settings.toX;
		this.toY = +settings.toY;
		this.time = +settings.time;
		if (settings.easing1 === 'Linear') {
			this.easing = window.TWEEN.Easing.Linear.None;
		} else {
			this.easing = window.TWEEN.Easing[settings.easing1][settings.easing2];
		}
		this.eventToEmit = { channel: settings.transitions.complete };
	};

	TweenTextureOffsetAction.prototype._setup = function () {
		this.tween = new window.TWEEN.Tween();
	};

	TweenTextureOffsetAction.prototype.cleanup = function (/*fsm*/) {
		if (this.tween) {
			this.tween.stop();
		}
	};

	TweenTextureOffsetAction.prototype._run = function (fsm) {
		var entity = fsm.getOwnerEntity();
		if (entity.meshRendererComponent && entity.meshRendererComponent.materials.length > 0) {
			var meshRendererComponent = entity.meshRendererComponent;
			var material = meshRendererComponent.materials[0];
			var texture = material.getTexture('DIFFUSE_MAP');
			var initialOffset = texture.offset;

			var fakeFrom = { x: initialOffset.x, y: initialOffset.y };
			var fakeTo = { x: this.toX, y: this.toY };

			this.tween.from(fakeFrom).to(fakeTo, this.time).easing(this.easing).onUpdate(function() {
				texture.offset.setd(this.x, this.y);
			}).onComplete(function() {
				fsm.send(this.eventToEmit.channel);
			}.bind(this)).start(fsm.getTime() * 1000);
		}
	};

	return TweenTextureOffsetAction;
});