define(
	/** @lends */
	function () {
	'use strict';

	/**
	 * @class The purpose of this class is to hold additional information regarding a typedarray buffer, like vbo 'usage' flags
	 * @param {ArrayBuffer} data Data to wrap
	 * @param {String} target Type of data ('ArrayBuffer'/'ElementArrayBuffer')
	 * @property {ArrayBuffer} data Data to wrap
	 * @property {String} target Type of data ('ArrayBuffer'/'ElementArrayBuffer')
	 */
	function BufferData(data, target) {
		this.data = data;
		this.target = target;

		this.glBuffer = null;

		this._dataUsage = 'StaticDraw';
		this._dataNeedsRefresh = false;
	}

	/**
	 * Set the usage type of this bufferdata.
	 * @param {string} dataUsage Usage Type
	 * <pre>
	 *		Usage Type:
	 *		'StaticDraw' - The data store contents will be speciﬁed once by the application,
	 *				and used many times as the source for GL drawing commands
	 *		'DynamicDraw' - The data store contents will be respeciﬁed repeatedly by the application, and used many times as the source for GL drawing commands.
	 *		'StreamDraw' - The data store contents will be speciﬁed once by the application,
	 *				and used at most a few times as the source of a GL drawing command
	 * </pre>
	 */
	BufferData.prototype.setDataUsage = function (dataUsage) {
		this._dataUsage = dataUsage;
	};

	/**
	 * Tell the engine that a buffer has been updated and needs to be refreshed.
	 */
	BufferData.prototype.setDataNeedsRefresh = function () {
		this._dataNeedsRefresh = true;
	};

	BufferData.prototype.destroy = function (context) {
		context.deleteBuffer(this.glBuffer);
	};

	return BufferData;
});