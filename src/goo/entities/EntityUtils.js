define([
	'goo/entities/components/TransformComponent',
	'goo/entities/components/MeshDataComponent',
	'goo/entities/components/MeshRendererComponent',
	'goo/entities/components/CameraComponent',
	'goo/entities/components/LightComponent',
	'goo/entities/components/ScriptComponent',
	'goo/scripts/Scripts',
	'goo/scripts/ScriptUtils',
	'goo/renderer/Camera',
	'goo/renderer/light/Light',
	'goo/renderer/Material',
	'goo/renderer/MeshData',
	'goo/renderer/bounds/BoundingBox',
	'goo/math/Transform',
	'goo/entities/components/CSSTransformComponent',
	'goo/entities/components/AnimationComponent',
	'goo/util/ObjectUtil'
],
	/** @lends */
	function (
		TransformComponent,
		MeshDataComponent,
		MeshRendererComponent,
		CameraComponent,
		LightComponent,
		ScriptComponent,
		Scripts,
		ScriptUtils,
		Camera,
		Light,
		Material,
		MeshData,
		BoundingBox,
		Transform,
		CSSTransformComponent,
		AnimationComponent,
		_
	) {
		'use strict';

		/**
		 * @class Utilities for entity creation etc
		 * @description Only used to define the class. Should never be instantiated.
		 */
		function EntityUtils() {
		}

		/*
		* @description Returns a clone of the given SkeletonPose. Also stores the cloned poses into settings, in order not to 
		* clone multiple instances of the same SkeletonPose.
		* @private
		* @param {SkeletonPose} skeletonPose
		* @param {Object} settings
		*/
		function cloneSkeletonPose(skeletonPose, settings) {
			settings.skeletonMap = settings.skeletonMap || {
				originals: [],
				clones: []
			};
			var idx = settings.skeletonMap.originals.indexOf(skeletonPose);
			var clonedSkeletonPose;
			if (idx === -1) {
				clonedSkeletonPose = skeletonPose.clone();
				settings.skeletonMap.originals.push(skeletonPose);
				settings.skeletonMap.clones.push(clonedSkeletonPose);
			} else {
				clonedSkeletonPose = settings.skeletonMap.clones[idx];
			}

			return clonedSkeletonPose;
		}

		//! AT: this is a huge mess
		// cloneEntity will only work for very few cases anyways, for very specific components
		function cloneEntity(world, entity, settings) {
			var newEntity = world.createEntity(entity.name);

			for (var i = 0; i < entity._components.length; i++) {
				var component = entity._components[i];
				if (component instanceof TransformComponent) {
					newEntity.transformComponent.transform.copy(component.transform);
				} else if (component instanceof MeshDataComponent) {
					var meshDataComponent = new MeshDataComponent(component.meshData);
					meshDataComponent.modelBound = new component.modelBound.constructor();
					if (component.currentPose) {
						meshDataComponent.currentPose = cloneSkeletonPose(component.currentPose, settings);
					}
					newEntity.setComponent(meshDataComponent);
				} else if (component instanceof MeshRendererComponent) {
					// REVIEW: Should the cloned new meshrendercomponent not get all the set member varialbes from the
					// cloned component? Now it gets defaulted from the constructor instead. The materials are also shared.
					// Maybe this is something to be pushed to another story, to actually use the settings sent to cloneEntity, as 
					// stated in the old review comment in clone() 
					var meshRendererComponent = new MeshRendererComponent();
					for (var j = 0; j < component.materials.length; j++) {
						meshRendererComponent.materials.push(component.materials[j]);
					}
					newEntity.setComponent(meshRendererComponent);

				} else if (component instanceof AnimationComponent) {
					var clonedAnimationComponent = component.clone();
					clonedAnimationComponent._skeletonPose = cloneSkeletonPose(component._skeletonPose, settings);
					newEntity.setComponent(clonedAnimationComponent);
				} else if (component instanceof ScriptComponent) {
					var scriptComponent = new ScriptComponent();
					for (var j = 0; j < component.scripts.length; j++) {
						var newScript;
						var script = component.scripts[j];
						var key = script.externals ? script.externals.key || script.externals.name : null;
						if (key && Scripts.getScript(key)) { // Engine script
							newScript = Scripts.create(key, script.parameters);
						} else { // Custom script
							newScript = {
								externals: script.externals,
								name: (script.name || '') + '_clone',
								enabled: !!script.enabled
							};
							if (script.parameters) { newScript.parameters = _.deepClone(script.parameters); }

							if (script.setup) { newScript.setup = script.setup; }
							if (script.update) { newScript.update = script.update; }
							if (script.setup) { newScript.cleanup = script.cleanup; }
							scriptComponent.scripts.push(newScript);
						}
					}
					newEntity.setComponent(scriptComponent);
					if (world.getSystem('ScriptSystem').manualSetup && component.scripts[0].context) {
						scriptComponent.setup(newEntity);
					}
				} else {
					newEntity.setComponent(component);
				}
			}
			for (var j = 0; j < entity.transformComponent.children.length; j++) {
				var child = entity.transformComponent.children[j];
				var clonedChild = cloneEntity(world, child.entity, settings);
				newEntity.transformComponent.attachChild(clonedChild.transformComponent);
			}

			if (settings.callback) {
				settings.callback(newEntity);
			}

			return newEntity;
		}

		/**
		 * Clone entity hierarchy with optional settings for sharing data and callbacks
		 * @param {World} world
		 * @param {Entity} entity The entity to clone
		 * @param {Object} [settings]
		 * @param {function(Entity)} [settings.callback] Callback to be run on every new entity. Takes entity as argument. Runs bottom to top in the cloned hierarchy.
		 */
		EntityUtils.clone = function (world, entity, settings) {
			settings = settings || {};
			// REVIEW: It's bad style to modify the settings object provided by the caller.
			// I.e. if the caller does:
			//   var s = {};
			//   EntityUtils.clone(w, e, s);
			// ...he wouldn't expect s to have changed.
			// REVIEW: `settings.shareData || true` will evaluate to true if shareData is false,
			// which means that the setting will always be true.
			settings.shareData = settings.shareData || true;
			settings.shareMaterial = settings.shareMaterial || true;  // REVIEW: these are not used nor documented but would be great if they were
			settings.cloneHierarchy = settings.cloneHierarchy || true;

			//! AT: why is everything here overridden anyways?
			// Why is this function just defaulting some parameters and then calling cloneEntity to do the rest?

			return cloneEntity(world, entity, settings);
		};

		/**
		 * Traverse the entity hierarchy upwards, returning the root entity
		 * @param {Entity} entity The entity to begin traversing from
		 * @returns {Entity} The root entity
		 */
		EntityUtils.getRoot = function (entity) {
			while (entity.transformComponent.parent) {
				entity = entity.transformComponent.parent.entity;
			}
			return entity;
		};

		//! AT: undocumented and used only once, in MeshBuilder
		EntityUtils.updateWorldTransform = function (transformComponent) {
			transformComponent.updateWorldTransform();

			for (var i = 0; i < transformComponent.children.length; i++) {
				EntityUtils.updateWorldTransform(transformComponent.children[i]);
			}
		};

		/**
		 * Shows an entity and its descendants if they are not hidden
		 * @param {Entity} entity The entity to show
		 */
		//! RB: refactor this out of here
		EntityUtils.show = function (entity) {
			entity.hidden = false;

			// first search if it has hidden parents to determine if itself should be visible
			var pointer = entity;
			while (pointer.transformComponent.parent) {
				pointer = pointer.transformComponent.parent.entity;
				if (pointer.hidden) {
					// extra check and set needed might be needed
					if (entity.meshRendererComponent) {
						entity.meshRendererComponent.hidden = true;
					}
					if (entity.lightComponent) {
						entity.lightComponent.hidden = true;
					}
					if (entity.htmlComponent) {
						entity.htmlComponent.hidden = true;
					}
					return;
				}
			}

			entity.traverse(function (entity) {
				if (entity.hidden) { return false; }
				if (entity.meshRendererComponent) {
					entity.meshRendererComponent.hidden = entity.hidden;
				}
				if (entity.lightComponent) {
					entity.lightComponent.hidden = entity.hidden;
				}
				if (entity.htmlComponent) {
					entity.htmlComponent.hidden = entity.hidden;
				}
			});
		};

		/**
		 * Hides the entity and its descendants
		 * @param {Entity} entity The entity to hide
		 */
		//! RB: refactor this out of here
		EntityUtils.hide = function (entity) {
			entity.hidden = true;

			// hide everything underneath this
			entity.traverse(function (entity) {
				if (entity.meshRendererComponent) {
					entity.meshRendererComponent.hidden = true;
				}
				if (entity.lightComponent) {
					entity.lightComponent.hidden = true;
				}
				if (entity.htmlComponent) {
					entity.htmlComponent.hidden = true;
				}
			});
		};

		/**
		 * Returns the merged bounding box of the entity and its children
		 * @param entity
		 */
		EntityUtils.getTotalBoundingBox = function (entity) {
			var mergedWorldBound = new BoundingBox();
			var first = true;
			entity.traverse(function (entity) {
				if (entity.meshRendererComponent) {
					if (first) {
						var boundingVolume = entity.meshRendererComponent.worldBound;
						if (boundingVolume instanceof BoundingBox) {
							boundingVolume.clone(mergedWorldBound);
						} else {
							mergedWorldBound.center.setv(boundingVolume.center);
							mergedWorldBound.xExtent = mergedWorldBound.yExtent = mergedWorldBound.zExtent = boundingVolume.radius;
						}
						first = false;
					} else {
						mergedWorldBound.merge(entity.meshRendererComponent.worldBound);
					}
				}
			});

			// if the whole hierarchy lacked mesh renderer components return
			// a tiny bounding box centered around the coordinates of the parent
			if (first) {
				var translation = entity.transformComponent.worldTransform.translation;
				mergedWorldBound = new BoundingBox(translation.clone(), 0.001, 0.001, 0.001);
			}

			return mergedWorldBound;
		};

		return EntityUtils;
	});
