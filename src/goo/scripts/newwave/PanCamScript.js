define([
	'goo/math/Vector3',
	'goo/scripts/Scripts',
	'goo/scripts/ScriptUtils',
	'goo/renderer/Renderer',
	'goo/entities/SystemBus'
], function (
	Vector3,
	Scripts,
	ScriptUtils,
	Renderer,
	SystemBus
) {
	'use strict';

	function PanCamScript() {
		var fwdVector, leftVector, moveVector, calcVector, calcVector2;
		var panButton;
		var lookAtPoint;
		var mouseState;
		var devicePixelRatio;
		var listeners;

		function getTouchCenter(touches) {
			var x1 = touches[0].clientX;
			var y1 = touches[0].clientY;
			var x2 = touches[1].clientX;
			var y2 = touches[1].clientY;
			var cx = (x1 + x2) / 2;
			var cy = (y1 + y2) / 2;
			return [cx, cy];
		}

		function setup(parameters, environment) {
			panButton = ['Any', 'Left', 'Middle', 'Right'].indexOf(parameters.panButton) - 1;
			if (panButton < -1) {
				panButton = -1;
			}
			lookAtPoint = environment.goingToLookAt;
			fwdVector = new Vector3(Vector3.UNIT_Y);
			leftVector = new Vector3(Vector3.UNIT_X).invert();
			moveVector = new Vector3();
			calcVector = new Vector3();
			calcVector2 = new Vector3();

			var renderer = environment.world.gooRunner.renderer;
			devicePixelRatio = renderer._useDevicePixelRatio && window.devicePixelRatio ?
				window.devicePixelRatio / renderer.svg.currentScale : 1;

			mouseState = {
				x: 0,
				y: 0,
				ox: 0,
				oy: 0,
				dx: 0,
				dy: 0,
				down: false
			};
			listeners = {
				mousedown: function (event) {
					if (!parameters.whenUsed || environment.entity === environment.activeCameraEntity) {
						var button = event.button;
						if (button === 0) {
							if (event.altKey) {
								button = 2;
							} else if (event.shiftKey) {
								button = 1;
							}
						}
						if (button === panButton || panButton === -1) {
							mouseState.down = true;
							var x = (event.offsetX !== undefined) ? event.offsetX : event.layerX;
							var y = (event.offsetY !== undefined) ? event.offsetY : event.layerY;
							mouseState.ox = mouseState.x = x;
							mouseState.oy = mouseState.y = y;
						}
					}
				},
				mouseup: function (event) {
					var button = event.button;
					if (button === 0) {
						if (event.altKey) {
							button = 2;
						} else if (event.shiftKey) {
							button = 1;
						}
					}
					mouseState.down = false;
					mouseState.dx = mouseState.dy = 0;
				},
				mousemove: function (event) {
					if (!parameters.whenUsed || environment.entity === environment.activeCameraEntity) {
						if (mouseState.down) {
							var x = (event.offsetX !== undefined) ? event.offsetX : event.layerX;
							var y = (event.offsetY !== undefined) ? event.offsetY : event.layerY;
							mouseState.x = x;
							mouseState.y = y;
							environment.dirty = true;
						}
					}
				},
				mouseleave: function (/*event*/) {
					mouseState.down = false;
					mouseState.ox = mouseState.x;
					mouseState.oy = mouseState.y;
				},
				touchstart: function (event) {
					if (!parameters.whenUsed || environment.entity === environment.activeCameraEntity) {
						mouseState.down = (event.targetTouches.length === 2);
						if (!mouseState.down) { return; }

						var center = getTouchCenter(event.targetTouches);
						mouseState.ox = mouseState.x = center[0];
						mouseState.oy = mouseState.y = center[1];
					}
				},
				touchmove: function (event) {
					if (!parameters.whenUsed || environment.entity === environment.activeCameraEntity) {
						if (!mouseState.down) { return; }

						var center = getTouchCenter(event.targetTouches);
						mouseState.x = center[0];
						mouseState.y = center[1];
					}
				},
				touchend: function (/*event*/) {
					mouseState.down = false;
					mouseState.ox = mouseState.x;
					mouseState.oy = mouseState.y;
				}
			};
			for (var event in listeners) {
				environment.domElement.addEventListener(event, listeners[event]);
			}
			environment.dirty = true;
		}

		function update(parameters, environment) {
			if (!environment.dirty) {
				return;
			}
			mouseState.dx = mouseState.x - mouseState.ox;
			mouseState.dy = mouseState.y - mouseState.oy;
			if (mouseState.dx === 0 && mouseState.dy === 0) {
				return;
			}

			if (parameters.invertX) {
				mouseState.dx = -mouseState.dx;
			}
			if (parameters.invertY) {
				mouseState.dy = -mouseState.dy;
			}

			mouseState.ox = mouseState.x;
			mouseState.oy = mouseState.y;

			var mainCam = Renderer.mainCamera;

			var entity = environment.entity;
			var transform = entity.transformComponent.transform;

			if (lookAtPoint && mainCam) {
				if (lookAtPoint.equals(mainCam.translation)) {
					return;
				}
				var camera = entity.cameraComponent.camera;
				var width = environment.domElement.offsetWidth;
				var height = environment.domElement.offsetHeight;
				mainCam.getScreenCoordinates(lookAtPoint, width, height, calcVector);
				calcVector.sub_d(
					mouseState.dx,/// (environment.viewportWidth/devicePixelRatio),
					mouseState.dy,/// (environment.viewportHeight/devicePixelRatio),
					0
				);
				mainCam.getWorldCoordinates(
					calcVector.x,
					calcVector.y,
					width,
					height,
					calcVector.z,
					calcVector
				);
				lookAtPoint.setv(calcVector);

			} else {
				calcVector.setv(fwdVector).scale(mouseState.dy);
				calcVector2.setv(leftVector).scale(mouseState.dx);

				//! schteppe: use world coordinates for both by default?
				//if (parameters.screenMove){
					// In the case of screenMove, we normalize the camera movement
					// to the near plane instead of using pixels. This makes the parallel
					// camera map mouse world movement to camera movement 1-1
					if (entity.cameraComponent && entity.cameraComponent.camera) {
						var camera = entity.cameraComponent.camera;
						calcVector.scale((camera._frustumTop - camera._frustumBottom) / environment.viewportHeight);
						calcVector2.scale((camera._frustumRight - camera._frustumLeft) / environment.viewportWidth);
					}
				//}
				calcVector.addv(calcVector2);
				transform.rotation.applyPost(calcVector);
				//if (!parameters.screenMove){
					// panSpeed should be 1 in the screenMove case, to make movement sync properly
					calcVector.scale(parameters.panSpeed);
				//}
				entity.transformComponent.transform.translation.addv(calcVector);
				entity.transformComponent.setUpdated();
				//environment.dirty = false;
			}
			SystemBus.emit('goo.cameraPositionChanged', {
				translation: transform.translation.data,
				lookAtPoint: lookAtPoint ? lookAtPoint.data : null,
				id: entity.id
			});
		}

		function cleanup(parameters, environment) {
			for (var event in listeners) {
				environment.domElement.removeEventListener(event, listeners[event]);
			}
		}

		return {
			setup: setup,
			update: update,
			cleanup: cleanup
		};
	}

	PanCamScript.externals = {
		name: 'PanCamControlScript',
		description: 'Enables camera to pan around a point in 3D space using the mouse',
		parameters: [{
			key: 'whenUsed',
			type: 'boolean',
			'default': true
		}, {
			key: 'panButton',
			name: 'Pan button',
			description: 'Only pan with this button',
			type: 'string',
			control: 'select',
			'default': 'Any',
			options: ['Any', 'Left', 'Middle', 'Right']
		}, {
			key: 'panSpeed',
			type: 'float',
			'default': 0.005,
			scale: 0.001,
			decimals: 3
		}, {
			key: 'screenMove',
			type: 'boolean',
			'default': false,
			description: 'Syncs camera movement with mouse world position 1-1, needed for parallel camera.'
		}]
	};

	return PanCamScript;
});