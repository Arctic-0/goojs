define([
	'goo/entities/systems/System',
	'goo/entities/SystemBus',
	'goo/renderer/SimplePartitioner',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Util',
	'goo/debug/DebugDrawHelper'
],
/** @lends */
function (
	System,
	SystemBus,
	SimplePartitioner,
	Material,
	ShaderLib,
	Util,
	DebugDrawHelper
) {
	"use strict";

	/**
	 * @class Renders entities/renderables using a configurable partitioner for culling
	 * @property {Boolean} doRender Only render if set to true
	 */
	function DebugRenderSystem() {
		System.call(this, 'DebugRenderSystem', ['TransformComponent']);

		this._renderablesTree = {};
		this.renderList = [];
		this.preRenderers = [];
		this.composers = [];
		this.doRender = {
			CameraComponent: false,
			LightComponent: false,
			MeshRendererComponent: false
		};
		this.inserted();

		this._interestComponents = [
			'CameraComponent',
			'LightComponent'
			//'MeshRendererComponent'
		];

		this.camera = null;
		this.lights = [];
		this.currentTpf = 0.0;
		this.scale = 20;

		// no more that!
		var that = this;
		SystemBus.addListener('goo.setCurrentCamera', function (newCam) {
			that.camera = newCam.camera;
		});

		SystemBus.addListener('goo.setLights', function (lights) {
			that.lights = lights;
		});

		this.selectionRenderable = DebugDrawHelper.getRenderablesFor({ type: 'MeshRendererComponent' });
		this.selectionActive = false;
	}

	DebugRenderSystem.prototype = Object.create(System.prototype);

	DebugRenderSystem.prototype.inserted = function (/*entity*/) {
	};

	DebugRenderSystem.prototype.deleted = function (/*entity*/) {
	};

	DebugRenderSystem.prototype.process = function (entities, tpf) {
		var count = this.renderList.length = 0;
		for (var i = 0; i < entities.length; i++) {
			var entity = entities[i];
			for (var j = 0, max = this._interestComponents.length; j < max; j++) {
				var componentName = this._interestComponents[j];
				if (entity.name !== 'ToolCameraEntity' && entity.hasComponent(componentName)) {
					var component = entity.getComponent(componentName);
					var renderables;
					var options = { full: this.doRender[componentName] || entity.getComponent(componentName).forceDebug };
					var tree = this._renderablesTree[entity.id] = this._renderablesTree[entity.id] || {};
					if (tree[componentName] && ((tree[componentName].length === 2 && options.full) || (tree[componentName].length === 1 && !options.full))) {
						renderables = tree[componentName];
					} else {
						renderables = DebugDrawHelper.getRenderablesFor(component, options);
						renderables.forEach(function (renderable) { renderable.id = entity.id; });
						tree[componentName] = renderables;
					}
					renderables.forEach(function (renderable) { renderable.transform.copy(entity.transformComponent.worldTransform); });
					DebugDrawHelper.update(renderables, component, this.camera.translation);
					renderables.forEach(function (renderable) { this.renderList[count++] = renderable; }.bind(this));
					//this.renderList[count++] = renderables[0];
					//this.renderList[count++] = renderables[1];
				}
			}
		}
		if (this.selectionActive) {
			this.renderList[count++] = this.selectionRenderable[0];
		}
		this.renderList.length = count;
		this.currentTpf = tpf;
	};

	DebugRenderSystem.prototype.render = function (renderer) {
		renderer.checkResize(this.camera);

		if (this.camera) {
			renderer.render(this.renderList, this.camera, this.lights, null, false);
		}
	};

	DebugRenderSystem.prototype.renderToPick = function (renderer, skipUpdateBuffer) {
		renderer.renderToPick(this.renderList, this.camera, false, skipUpdateBuffer);
	};

	return DebugRenderSystem;
});