define([
	'goo/entities/components/Component',
	'goo/shapes/TextureGrid',
	'goo/entities/components/MeshDataComponent'
],
/** @lends */
function (
	Component
) {
	'use strict';

	/**
	 * @class
	 * {@linkplain http://code.gooengine.com/latest/visual-test/goo/entities/components/TextComponent/TextComponent-vtest.html Working example}
	 * @extends Component
	 */
	function TextComponent_(text) {
		this.type = 'TextComponent';

		this.text = text || '';
		this.dirty = true;
	}

	var TextComponent = TextComponent_;

	TextComponent.prototype = Object.create(Component.prototype);
	TextComponent.prototype.constructor = TextComponent;

	/**
	 * Text to update to
	 * @param {String} text
	 * @returns {TextComponent} Self for chaining
	 */
	TextComponent.prototype.setText = function (text) {
		this.text = text;
		this.dirty = true;
		return this;
	};

	return TextComponent;
});