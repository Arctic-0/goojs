define([
	'goo/entities/systems/System',
	'goo/entities/SystemBus',
	'goo/renderer/SimplePartitioner',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Util'
],
/** @lends */
function (
	System,
	SystemBus,
	SimplePartitioner,
	Material,
	ShaderLib,
	Util
) {
	'use strict';

	/**
	 * @class Renders entities/renderables using a configurable partitioner for culling
	 * @property {Boolean} doRender Only render if set to true
	 * @extends System
	 */
	function RenderSystem() {
		System.call(this, 'RenderSystem', ['MeshRendererComponent', 'MeshDataComponent']);

		this.entities = [];
		this.renderList = [];
		this.postRenderables = [];
		this.partitioner = new SimplePartitioner();
		this.preRenderers = [];
		this.composers = [];
		this._composersActive = true;
		this.doRender = true;

		this._debugMaterials = {};
		this.overrideMaterials = [];

		this.camera = null;
		this.lights = [];
		this.currentTpf = 0.0;

		// stop using this pattern!
		var that = this;
		SystemBus.addListener('goo.setCurrentCamera', function (newCam) {
			that.camera = newCam.camera;
		});

		SystemBus.addListener('goo.setLights', function (lights) {
			that.lights = lights;
		});

		this.picking = {
			doPick: false,
			x: 0,
			y: 0,
			pickingStore: {},
			pickingCallback: function(id, depth) {
				console.log(id, depth);
			},
			skipUpdateBuffer: false
		};
		//this.setDebugMaterial('wireframe');
	}

	RenderSystem.prototype = Object.create(System.prototype);

	RenderSystem.prototype.pick = function (x, y, callback, skipUpdateBuffer) {
		this.picking.x = x;
		this.picking.y = y;
		this.picking.skipUpdateBuffer = skipUpdateBuffer === undefined ? false : skipUpdateBuffer;
		if (callback) {
			this.picking.pickingCallback = callback;
		}
		this.picking.doPick = true;
	};

	RenderSystem.prototype.inserted = function (entity) {
		if (this.partitioner) {
			this.partitioner.added(entity);
		}
	};

	RenderSystem.prototype.deleted = function (entity) {
		if (this.partitioner) {
			this.partitioner.removed(entity);
		}
	};

	RenderSystem.prototype.process = function (entities, tpf) {
		this.entities = entities;
		this.currentTpf = tpf;
	};

	RenderSystem.prototype.render = function (renderer) {
		if (!this.doRender) {
			return;
		}

		if (this.camera) {
			renderer.updateShadows(this.partitioner, this.entities, this.lights);

			for (var i = 0; i < this.preRenderers.length; i++) {
				var preRenderer = this.preRenderers[i];
				preRenderer.process(renderer, this.entities, this.partitioner, this.camera, this.lights);
			}

			this.partitioner.process(this.camera, this.entities, this.renderList);

			if (this.composers.length > 0 && this._composersActive) {
				for (var i = 0; i < this.composers.length; i++) {
					var composer = this.composers[i];
					composer.render(renderer, this.currentTpf, this.camera, this.lights, null, true, this.overrideMaterials);
				}
			} else {
				renderer.render(this.renderList, this.camera, this.lights, null, true, this.overrideMaterials);
			}
		}
	};

	RenderSystem.prototype.renderToPick = function(renderer, skipUpdateBuffer) {
		renderer.renderToPick(this.renderList, this.camera, true, skipUpdateBuffer);
	};

	RenderSystem.prototype.enableComposers = function(activate) {
		this._composersActive = !!activate;
	};

	RenderSystem.prototype._createDebugMaterial = function(key) {
		if (key === '') {
			return;
		}
		var fshader;
		switch(key) {
			case 'wireframe':
			case 'color':
				fshader = Util.clone(ShaderLib.simpleColored.fshader);
				break;
			case 'lit':
				fshader = Util.clone(ShaderLib.simpleLit.fshader);
				break;
			case 'texture':
				fshader = Util.clone(ShaderLib.textured.fshader);
				break;
			case 'normals':
				fshader = Util.clone(ShaderLib.showNormals.fshader);
				break;
			case 'simple':
				fshader = Util.clone(ShaderLib.simple.fshader);
				break;
		}
		var shaderDef = Util.clone(ShaderLib.uber);
		shaderDef.fshader = fshader;
		if(key !== 'flat') {
			this._debugMaterials[key] = Material.createMaterial(shaderDef, key);
			if (key === 'wireframe') {
				this._debugMaterials[key].wireframe = true;
			}
			if (key === 'lit') {
				this._debugMaterials[key]._textureMaps = {
					EMISSIVE_MAP: null,
					DIFFUSE_MAP: null,
					SPECULAR_MAP: null,
					NORMAL_MAP: null,
					AO_MAP: null,
					LIGHT_MAP: null,
					TRANSPARENCY_MAP: null
				};
			}
		} else {
			this._debugMaterials[key] = Material.createEmptyMaterial(null, key);
			this._debugMaterials[key].flat = true;
		}
	};

	RenderSystem.prototype.setDebugMaterial = function(key) {
		if(!key || key === '') {
			this.overrideMaterials = [];
			return;
		}
		var debugs = key.split('+');
		this.overrideMaterials = [];

		for(var i = 0; i < debugs.length; i++) {
			var key = debugs[i];
			if(!this._debugMaterials[key]) {
				this._createDebugMaterial(key);
			}
			if(key === '') {
				this.overrideMaterials.push(null);
			} else {
				this.overrideMaterials.push(this._debugMaterials[key]);
			}
		}
	};

	return RenderSystem;
});