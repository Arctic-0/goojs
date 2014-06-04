define([
	'goo/entities/components/Component',
	'goo/sound/AudioContext',
	'goo/math/Vector3',
	'goo/math/MathUtils'
],
/** @lends */
function (
	Component,
	AudioContext,
	Vector3,
	MathUtils
) {
	'use strict';

	//! AT: every method here is prefixed with a check for AudioContext. Is it really needed? can it just be refactored away?
	//Or, isn't just one (the first) warning enough - it might ruing everything if flooding the console

	/**
	 * @class Component that adds sound to an entity.
	 * {@linkplain http://code.gooengine.com/latest/visual-test/goo/addons/Sound/Sound-vtest.html Working example}
	 * @extends {Component}
	 */
	function SoundComponent() {
		if (!AudioContext) {
			console.warn('Cannot create soundComponent, webaudio not supported');
			return;
		}
		this.type = 'SoundComponent';

		/**
		 * Current sounds in the entity. Add a sound using {@link SoundComponent#addSound}.
		 * @type {Array<Sound>}
		 */
		this.sounds = [];
		this._isPanned = true; // REVIEW: this is private and only set here so... remove? it would simplify some code paths in the .process method
		this._outDryNode = AudioContext.createGain();
		this._outWetNode = AudioContext.createGain();
		this.connectTo();
		this._pannerNode = AudioContext.createPanner();

		this._pannerNode.connect(this._outDryNode);
		this._inNode = AudioContext.createGain();
		this._inNode.connect(this._pannerNode);
		this._oldPosition = new Vector3();
		this._position = new Vector3();
		this._orientation = new Vector3();
		this._velocity = new Vector3();
		this._attachedToCamera = false;
	}

	SoundComponent.prototype = Object.create(Component.prototype);
	SoundComponent.prototype.constructor = SoundComponent;

	/**
	 * Add a sound to the component
	 * @param {Sound} sound
	 */
	SoundComponent.prototype.addSound = function (sound) {
		if (!AudioContext) {
			console.warn('Webaudio not supported');
			return;
		}
		if (this.sounds.indexOf(sound) === -1) {
			sound.connectTo([this._inNode, this._outWetNode]);
			this.sounds.push(sound);
		}
	};

	/**
	 * Remove sound from component
	 * @param {Sound} sound
	 */
	SoundComponent.prototype.removeSound = function (sound) {
		if (!AudioContext) {
			console.warn('Webaudio not supported');
			return;
		}
		var idx = this.sounds.indexOf(sound);
		if (idx > -1) {
			sound.stop();
			this.sounds.splice(idx, 1);
			sound.connectTo();
		}
	};

	/**
	 * Get a component's sound by id
	 * @param {string} id
	 * @returns {Sound}
	 */
	SoundComponent.prototype.getSoundById = function (id) {
		for (var i = 0; i < this.sounds.length; i++) {
			if (this.sounds[i].id === id) {
				return this.sounds[i];
			}
		}
	};

	/**
	 * Connect output of component to audionodes
	 * @param {object} [nodes]
	 * @param {AudioNode} [nodes.dry]
	 * @param {AudioNode} [nodes.wet]
	 */
	SoundComponent.prototype.connectTo = function (nodes) {
		if (!AudioContext) {
			//! AT: can you get an audionode and call this function if you have no audio context?
			console.warn('Webaudio not supported');
			return;
		}
		this._outDryNode.disconnect();
		this._outWetNode.disconnect();
		if (nodes && nodes.dry) {
			this._outDryNode.connect(nodes.dry);
		}
		if (nodes && nodes.wet) {
			this._outWetNode.connect(nodes.wet);
		}
	};

	/**
	 * Updates the component valueas according to config
	 * @param {object} [config]
	 * @param {number} config.volume
	 * @param {number} config.reverb
	 */
	SoundComponent.prototype.updateConfig = function (config) {
		if (!AudioContext) {
			console.warn('Webaudio not supported');
			return;
		}
		if (config.volume !== undefined) {
			this._outDryNode.gain.value = MathUtils.clamp(config.volume, 0, 1);
		}
		if (config.reverb !== undefined) {
			this._outWetNode.gain.value = MathUtils.clamp(config.reverb, 0, 1);
		}
	};

	/**
	 * Updates position, velocity and orientation of component and thereby all connected sounds.
	 * Since all sounds in the engine are relative to the current camera, the model view matrix needs to be passed to this method.
	 * @param {object} settings See {@link SoundSystem}
	 * @param {Matrix4x4} mvMat The model view matrix from the current camera, or falsy if the component is attached to the camera.
	 * @param {number} tpf
	 * @private
	 */
	SoundComponent.prototype.process = function (settings, mvMat, tpf) {
		if (!AudioContext) {
			// Should never happen
			return;
		}
		this._pannerNode.rolloffFactor = settings.rolloffFactor;
		this._pannerNode.maxDistance = settings.maxDistance;

		if (this._attachedToCamera || !mvMat) {
			// The component is attached to the current camera.
			if (this._isPanned) {
				this._inNode.disconnect();
				this._inNode.connect(this._outDryNode);
			}
			this._pannerNode.setPosition(0, 0, 0);
			this._pannerNode.setVelocity(0, 0, 0);
			this._pannerNode.setOrientation(0, 0, 0);
			return;
		} else if (!this._isPanned) {
			this._inNode.disconnect();
			this._inNode.connect(this._pannerNode);
		}

		mvMat.getTranslation(this._position);
		this._velocity.setv(this._position).subv(this._oldPosition).div(tpf);
		this._oldPosition.setv(this._position);
		this._orientation.setd(0, 0, -1);
		mvMat.applyPostVector(this._orientation);

		var pd = this._position.data;
		this._pannerNode.setPosition(pd[0], pd[1], pd[2]);
		var vd = this._velocity.data;
		this._pannerNode.setVelocity(vd[0], vd[1], vd[2]);
		var od = this._orientation.data;
		this._pannerNode.setOrientation(od[0], od[1], od[2]);
	};

	return SoundComponent;
});