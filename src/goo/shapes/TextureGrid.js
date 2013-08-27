define(['goo/renderer/MeshData'],
	/** @lends */
	function (MeshData) {
	"use strict";

	function TextureGrid(matrix, textureUnitsPerLine) {
	    this.matrix = matrix;
		this.textureUnitsPerLine = textureUnitsPerLine || 8;

		var attributeMap = MeshData.defaultMap([MeshData.POSITION, MeshData.NORMAL, MeshData.TEXCOORD0]);
		var nCells = countCells(matrix);
		// REVIEW: Shouldn't it be nCells * 4?
		MeshData.call(this, attributeMap, nCells * 3 * 2, nCells * 6);

		this.rebuild();
	}

	TextureGrid.prototype = Object.create(MeshData.prototype);

	function countCells(matrix) {
		var count = 0;
		for(var i = 0; i < matrix.length; i++) {
			count += matrix[i].length;
		}
		return count;
	}

	TextureGrid.prototype.setText = function (str) {
		this.matrix = stringToMatrix(str);
		var nCells = countCells(this.matrix);
		// REVIEW: Shouldn't it be nCells * 4?
		this.rebuildData(nCells * 3 * 2, nCells * 6);
		this.rebuild();
	};

	/**
	 * @description Builds or rebuilds the mesh data.
	 * @returns {TextureGrid} Self for chaining.
	 */
	TextureGrid.prototype.rebuild = function () {
		var verts = [];
		var norms = [];
		var indices = [];
		var tex = [];

		var indexCounter = 0;
		for (var i = 0; i < this.matrix.length; i++) {
			for (var j = 0; j < this.matrix[i].length; j++) {
				verts.push(
					j    , -i - 1, 0,
					j    , -i    , 0,
					j + 1, -i    , 0,
					j + 1, -i - 1, 0);

				norms.push(
					0, 0, 1,
					0, 0, 1,
					0, 0, 1,
					0, 0, 1);

				var texX = (this.matrix[i][j] % this.textureUnitsPerLine) / this.textureUnitsPerLine;
				var texY = Math.floor(this.matrix[i][j] / this.textureUnitsPerLine) / this.textureUnitsPerLine;
				texY = 1 - texY;

				tex.push(
					 texX      , texY - 1/this.textureUnitsPerLine,
					 texX      , texY,
					 texX + 1/this.textureUnitsPerLine, texY,
					 texX + 1/this.textureUnitsPerLine, texY - 1/this.textureUnitsPerLine);

				indices.push(
					indexCounter + 3, indexCounter + 1, indexCounter + 0,
					indexCounter + 2, indexCounter + 1, indexCounter + 3);

				indexCounter += 4;
			}
		}

		this.getAttributeBuffer(MeshData.POSITION).set(verts);
		this.getAttributeBuffer(MeshData.NORMAL).set(norms);
		this.getAttributeBuffer(MeshData.TEXCOORD0).set(tex);

		this.getIndexBuffer().set(indices);

		return this;
	};

	function stringToMatrix(str) {
		var matrix = [];
		var lineAr = str.split('\n');
		lineAr.forEach(function(line) {
			var charAr = line.split('');
			var matrixLine = charAr.map(function(ch) { return ch.charCodeAt(0); });
			matrix.push(matrixLine);
		});
		return matrix;
	}

	TextureGrid.fromString = function(str) {
		return new TextureGrid(stringToMatrix(str), 16);
	};

	return TextureGrid;
});