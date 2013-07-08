define(
[
	"goo/shapes/ShapeCreator",
	'goo/math/Transform',
	'goo/renderer/MeshData'
], function(
	ShapeCreator,
	Transform,
	MeshData
) {
	"use strict";

	describe("MeshData", function() {
		it("getNormalsMeshData: number of vertices and indices", function() {
			var box = ShapeCreator.createBox();
			var normalsMD = box.getNormalsMeshData();

			var nNormalsPerFace = 4;
			var nFaces = 6;
			var nVerticesPerLine = 2;
			var nDimensions = 3;

			expect(normalsMD.vertexCount).toEqual(nNormalsPerFace * nFaces * nVerticesPerLine * nDimensions);
			expect(normalsMD.indexCount).toEqual(nNormalsPerFace * nFaces * nVerticesPerLine);
		});

		it("can translate vertices", function() {
			var box = ShapeCreator.createQuad();

			var transform = new Transform();
			transform.translation.setd(1, 2, 3);
			transform.update();
			box.applyTransform(MeshData.POSITION, transform);

			expect(box.dataViews.POSITION[0]).toBeCloseTo(0.5); // -0.5 + 1
			expect(box.dataViews.POSITION[1]).toBeCloseTo(1.5); // -0.5 + 2
			expect(box.dataViews.POSITION[2]).toBeCloseTo(3.0); //  0.0 + 3

			expect(box.dataViews.POSITION[3]).toBeCloseTo(0.5); // -0.5 + 1
			expect(box.dataViews.POSITION[4]).toBeCloseTo(2.5); //  0.5 + 2
			expect(box.dataViews.POSITION[5]).toBeCloseTo(3.0); //  0.0 + 3

			expect(box.dataViews.POSITION[6]).toBeCloseTo(1.5); //  0.5 + 1
			expect(box.dataViews.POSITION[7]).toBeCloseTo(2.5); //  0.5 + 2
			expect(box.dataViews.POSITION[8]).toBeCloseTo(3.0); //  0.0 + 3

			expect(box.dataViews.POSITION[9]).toBeCloseTo(1.5);  //  0.5 + 1
			expect(box.dataViews.POSITION[10]).toBeCloseTo(1.5); // -0.5 + 2
			expect(box.dataViews.POSITION[11]).toBeCloseTo(3.0); //  0.0 + 3
		});

		it("can rotate vertices", function() {
			var box = ShapeCreator.createQuad();

			var transform = new Transform();
			transform.setRotationXYZ(Math.PI/4, 0, 0);
			transform.update();
			box.applyTransform(MeshData.POSITION, transform);

			expect(box.dataViews.POSITION[0]).toBeCloseTo(-0.5 ); // -0.5
			expect(box.dataViews.POSITION[1]).toBeCloseTo(-Math.sqrt(2)/4); // -Math.sqrt(2)/4
			expect(box.dataViews.POSITION[2]).toBeCloseTo(-Math.sqrt(2)/4); // -Math.sqrt(2)/4

			expect(box.dataViews.POSITION[3]).toBeCloseTo(-0.5); // -0.5
			expect(box.dataViews.POSITION[4]).toBeCloseTo( Math.sqrt(2)/4); //  Math.sqrt(2)/4
			expect(box.dataViews.POSITION[5]).toBeCloseTo( Math.sqrt(2)/4); //  Math.sqrt(2)/4

			expect(box.dataViews.POSITION[6]).toBeCloseTo( 0.5); //  0.5
			expect(box.dataViews.POSITION[7]).toBeCloseTo( Math.sqrt(2)/4); //  Math.sqrt(2)/4
			expect(box.dataViews.POSITION[8]).toBeCloseTo( Math.sqrt(2)/4); //  Math.sqrt(2)/4

			expect(box.dataViews.POSITION[9]).toBeCloseTo( 0.5);  //  0.5
			expect(box.dataViews.POSITION[10]).toBeCloseTo(-Math.sqrt(2)/4); // -Math.sqrt(2)/4
			expect(box.dataViews.POSITION[11]).toBeCloseTo(-Math.sqrt(2)/4); // -Math.sqrt(2)/4

		});

		it("can apply a function on vertices", function() {
			var box = ShapeCreator.createQuad();

			box.applyFunction(MeshData.POSITION, function(vert) {
				vert.data[2] = vert.data[0] + vert.data[1];
				return vert;
			});

			expect(box.dataViews.POSITION[0]).toBeCloseTo(-0.5); // -0.5
			expect(box.dataViews.POSITION[1]).toBeCloseTo(-0.5); // -0.5
			expect(box.dataViews.POSITION[2]).toBeCloseTo(-1.0); //  0.0

			expect(box.dataViews.POSITION[3]).toBeCloseTo(-0.5); // -0.5
			expect(box.dataViews.POSITION[4]).toBeCloseTo( 0.5); //  0.5
			expect(box.dataViews.POSITION[5]).toBeCloseTo( 0.0); //  0.0

			expect(box.dataViews.POSITION[6]).toBeCloseTo( 0.5); //  0.5
			expect(box.dataViews.POSITION[7]).toBeCloseTo( 0.5); //  0.5
			expect(box.dataViews.POSITION[8]).toBeCloseTo( 1.0); //  0.0

			expect(box.dataViews.POSITION[9]).toBeCloseTo( 0.5);  //  0.5
			expect(box.dataViews.POSITION[10]).toBeCloseTo(-0.5); // -0.5
			expect(box.dataViews.POSITION[11]).toBeCloseTo( 0.0); //  0.0
		});
	});
});
