define([
	'goo/entities/components/Component',
	'goo/math/Vector3',
	'goo/renderer/Camera',
	'goo/entities/SystemBus'
],
/** @lends */
function (
	Component,
	Vector3,
	Camera,
	SystemBus
) {
	'use strict';

	/**
	 * @class Holds a camera.
	 * @param {Camera} camera Camera to contain in this component.
	 * @extends Component
	 */
	function CameraComponent (camera) {
		this.type = 'CameraComponent';

		/** The camera contained by the component.
		 * @type {Camera}
		 */
		this.camera = camera;

		/** Left vector.
		 * @type {Vector3}
		 * @default (-1, 0, 0)
		 */
		this.leftVec = new Vector3(-1, 0, 0);

		/** Up vector.
		 * @type {Vector3}
		 * @default (0, 1, 0)
		 */	
		this.upVec = new Vector3(0, 1, 0);

		/** Direction vector.
		 * @type {Vector3}
		 * @default (0, 0, -1)
		 */
		this.dirVec = new Vector3(0, 0, -1);

		this.api = {
			//! AT: the component holds no reference to its entity therefore this method could never stay on the component
			setAsMainCamera: function () {
				SystemBus.emit('goo.setCurrentCamera', {
					camera: this.cameraComponent.camera,
					entity: this
				});
				return this;
			}
		};
	}

	CameraComponent.type = 'CameraComponent';

	CameraComponent.prototype = Object.create(Component.prototype);
	CameraComponent.prototype.constructor = CameraComponent;

	/**
	 * @param {number} axisId Axis to use as up-vector (0=X, 1=Y, 2=Z).
	 */
	CameraComponent.prototype.setUpVector = function (axisId) {
		if (axisId === 0) {
			this.leftVec.setd(0, -1, 0);
			this.upVec.setd(1, 0, 0);
			this.dirVec.setd(0, 0, -1);
		} else if (axisId === 2) {
			this.leftVec.setd(-1, 0, 0);
			this.upVec.setd(0, 0, 1);
			this.dirVec.setd(0, -1, 0);
		} else {
			this.leftVec.setd(-1, 0, 0);
			this.upVec.setd(0, 1, 0);
			this.dirVec.setd(0, 0, -1);
		}
	};

	/**
	 * Updates the contained camera according to a transform (coming from the TransformComponent).
	 * @param {Transform} transform
	 */
	CameraComponent.prototype.updateCamera = function (transform) {
		this.camera._left.setv(this.leftVec);
		transform.matrix.applyPostVector(this.camera._left);

		this.camera._up.setv(this.upVec);
		transform.matrix.applyPostVector(this.camera._up);

		this.camera._direction.setv(this.dirVec);
		transform.matrix.applyPostVector(this.camera._direction);

		transform.matrix.getTranslation(this.camera.translation);

		this.camera.update();
	};

	CameraComponent.applyOnEntity = function(obj, entity) {
		if (obj instanceof Camera) {
			var cameraComponent = new CameraComponent(obj);
			entity.setComponent(cameraComponent);
			return true;
		}
	};

	return CameraComponent;
});