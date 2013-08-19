define([], function() {
	var ArrayUtil = {};

	/**
	 * Utilities for arrays and typed arrays
	 */
	

	/** 
	 * Create a typed array view on an ArrayBuffer, using the supplied pointer. Notice that this
	 * does not copy any elements, if you make changes to the returned array, the original 
	 * ArrayBuffer will be modified. 
	 * 
	 * @param {ArrayBuffer} arrayBuffer
	 * @param {Array} pointer Array [start, length, format] where start is the start byte offset
	 * in the buffer, length is the number of values of the given format, and format is a string 
	 * denoting the data format:
	 * 'float32' creates a Float32Array
	 * 'uint32'
	 * 'uint16'
	 * 'uint8'
	 *
	 * @return Typed array
	 */
	ArrayUtil.getTypedArray = function(arrayBuffer, pointer) {
		var start = pointer[0];
		var length = pointer[1];
		var format = pointer[2];

		if (format == 'float32') {
			return new Float32Array(arrayBuffer, start, length);
		}
		else if (format == 'uint8') {
			return new Uint8Array(arrayBuffer, start, length);
		}
		else if (format == 'uint16') {
			return new Uint16Array(arrayBuffer, start, length);
		}
		else if (format == 'uint32') {
			return new Uint32Array(arrayBuffer, start, length);
		}
		else {
			throw new Error("Binary format #{format} is not supported");
		}
	}


	ArrayUtil.remove = function(array, value) {
		array.splice(array.indexOf(value), 1);
	}


	return ArrayUtil;


});
