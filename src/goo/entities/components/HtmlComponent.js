define([
	'goo/entities/components/Component'
], /** @lends */ function (
	Component
) {
	'use strict';

	/**
	 * HTML Component.
	 * @class
	 * @extends Component
	 */
	function HtmlComponent(domElement) {
		Component.call(this);
		this.type = 'HtmlComponent';

		/**
		* DOM element.
		*/
		this.domElement = domElement;

		/**
		 * @type {boolean}
		 * @default 
		 */
		this.hidden = false;

		/**
		 * @type {boolean}
		 * @default
		 */
		this.useTransformComponent = true;
	}

	HtmlComponent.prototype = Object.create(Component.prototype);
	HtmlComponent.prototype.constructor = HtmlComponent;

	return HtmlComponent;
});
