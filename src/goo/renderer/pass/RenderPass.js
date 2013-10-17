define(['goo/renderer/Renderer',
	'goo/math/Vector4'],
	/** @lends */
	function (Renderer,
	Vector4) {
	"use strict";

	/**
	 * @class A pass that renders provided renderlist to the rendertarget or screen
	 */
	function RenderPass(renderList, filter) {
		this.renderList = renderList;
		this.filter = filter;

		this.clearColor = new Vector4(0.0, 0.0, 0.0, 0.0);
		this.oldClearColor = new Vector4();
		this.renderToScreen = false;

		this.overrideMaterial = null;

		this.enabled = true;
		this.clear = true;
		this.needsSwap = false;
	}

	// RenderPasses may have a fourth additional parameter called delta
	RenderPass.prototype.render = function (renderer, writeBuffer, readBuffer, delta, maskActive, camera, lights, clearColor) {
		camera = camera || Renderer.mainCamera;
		lights = lights || [];
		if (clearColor) {
			this.oldClearColor.setv(renderer.clearColor);
			renderer.setClearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
		}

		var renderList;
		if (this.filter) {
			renderList = this.renderList.filter(this.filter);
		} else {
			renderList = this.renderList;
		}
		if (this.renderToScreen) {
			renderer.render(renderList, camera, lights);
		} else {
			renderer.render(renderList, camera, lights, readBuffer, this.clear, this.overrideMaterial);
		}

		if (this.clearColor) {
			var oc = this.oldClearColor.data;
			renderer.setClearColor(oc[0], oc[1], oc[2], oc[3]);
		}
	};

	return RenderPass;
});