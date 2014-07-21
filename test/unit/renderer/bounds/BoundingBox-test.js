define([
	'goo/renderer/bounds/BoundingBox',
	'goo/renderer/bounds/BoundingSphere',
	'goo/math/Vector3',
	'goo/shapes/Box',
	'goo/renderer/MeshData'
], function(
	BoundingBox,
	BoundingSphere,
	Vector3,
	Box,
	MeshData
) {
	'use strict';

	describe('BoundingBox', function() {
		var boundingBox1, boundingBox2;

		function buildCustomTriangle(verts) {
			var indices = [];
			indices.push(0, 1, 2);

			var meshData = new MeshData(MeshData.defaultMap([MeshData.POSITION]), 3, indices.length);

			meshData.getAttributeBuffer(MeshData.POSITION).set(verts);
			meshData.getIndexBuffer().set(indices);

			meshData.indexLengths = [3];
			meshData.indexModes = ['Triangles'];

			return meshData;
		}

		describe('computeFromPoints', function() {
			it('computes the center of the bounding box from verts (of default box)', function() {
				boundingBox1 = new BoundingBox();

				var boxMeshData = new Box();
				boundingBox1.computeFromPoints(boxMeshData.dataViews.POSITION);
				expect(boundingBox1.center.data[0]).toBeCloseTo(0);
				expect(boundingBox1.center.data[1]).toBeCloseTo(0);
				expect(boundingBox1.center.data[2]).toBeCloseTo(0);
			});

			it('computes the center of the bounding box from verts (of custom triangle)', function() {
				boundingBox1 = new BoundingBox();
				var triangleMeshData = buildCustomTriangle([0, -5, 10, 2, 5, 20, 0, 1, 11]);
				boundingBox1.computeFromPoints(triangleMeshData.dataViews.POSITION);
				expect(boundingBox1.center.data[0]).toBeCloseTo(1);
				expect(boundingBox1.center.data[1]).toBeCloseTo(0);
				expect(boundingBox1.center.data[2]).toBeCloseTo(15);
			});

			it('computes max & min of the bounding box from verts (of default box)', function() {
				boundingBox1 = new BoundingBox();
				var boxMeshData = new Box();
				boundingBox1.computeFromPoints(boxMeshData.dataViews.POSITION);
				expect(boundingBox1.min.data[0]).toBeCloseTo(-0.5);
				expect(boundingBox1.min.data[1]).toBeCloseTo(-0.5);
				expect(boundingBox1.min.data[2]).toBeCloseTo(-0.5);
				expect(boundingBox1.max.data[0]).toBeCloseTo(0.5);
				expect(boundingBox1.max.data[1]).toBeCloseTo(0.5);
				expect(boundingBox1.max.data[2]).toBeCloseTo(0.5);
			});

			it('computes max & min of the bounding box from verts (of custom triangle)', function() {
				boundingBox1 = new BoundingBox();
				var triangleMeshData = buildCustomTriangle([0, -5, 10, 2, 5, 20, 0, 1, 11]);
				boundingBox1.computeFromPoints(triangleMeshData.dataViews.POSITION);
				expect(boundingBox1.min.data[0]).toBeCloseTo(0);
				expect(boundingBox1.min.data[1]).toBeCloseTo(-5);
				expect(boundingBox1.min.data[2]).toBeCloseTo(10);
				expect(boundingBox1.max.data[0]).toBeCloseTo(2);
				expect(boundingBox1.max.data[1]).toBeCloseTo(5);
				expect(boundingBox1.max.data[2]).toBeCloseTo(20);
			});

			it('computes x/y/zExtent of the bounding box from verts (of default box)', function() {
				boundingBox1 = new BoundingBox();
				var boxMeshData = new Box();
				boundingBox1.computeFromPoints(boxMeshData.dataViews.POSITION);
				expect(boundingBox1.xExtent).toBeCloseTo(0.5);
				expect(boundingBox1.yExtent).toBeCloseTo(0.5);
				expect(boundingBox1.zExtent).toBeCloseTo(0.5);
			});

			it('computes x/y/zExtent of the bounding box from verts (of custom triangle)', function() {
				boundingBox1 = new BoundingBox();
				var triangleMeshData = buildCustomTriangle([0, -5, 10, 2, 5, 20, 0, 1, 11]);
				boundingBox1.computeFromPoints(triangleMeshData.dataViews.POSITION);
				expect(boundingBox1.xExtent).toBeCloseTo(1);
				expect(boundingBox1.yExtent).toBeCloseTo(5);
				expect(boundingBox1.zExtent).toBeCloseTo(5);
			});
		});

		describe('merge', function() {
			it('merges two identical overlapping boxes', function() {
				boundingBox1 = new BoundingBox(new Vector3(0, 0, 0), 2, 3, 4);
				boundingBox2 = new BoundingBox(new Vector3(0, 0, 0), 2, 3, 4);

				var mergedBoundingBox = boundingBox1.merge(boundingBox2);
				expect(mergedBoundingBox.center.data[0]).toBeCloseTo(0);
				expect(mergedBoundingBox.center.data[1]).toBeCloseTo(0);
				expect(mergedBoundingBox.center.data[2]).toBeCloseTo(0);
				expect(mergedBoundingBox.xExtent).toBeCloseTo(2);
				expect(mergedBoundingBox.yExtent).toBeCloseTo(3);
				expect(mergedBoundingBox.zExtent).toBeCloseTo(4);
			});

			it('merges two intersecting boxes', function() {
				boundingBox1 = new BoundingBox(new Vector3(-5, -5, -5), 10, 10, 10);
				boundingBox2 = new BoundingBox(new Vector3(10, 10, 10), 10, 10, 10);

				var mergedBoundingBox = boundingBox1.merge(boundingBox2);
				expect(mergedBoundingBox.center.data[0]).toBeCloseTo((-15 + 20) / 2);
				expect(mergedBoundingBox.center.data[1]).toBeCloseTo((-15 + 20) / 2);
				expect(mergedBoundingBox.center.data[2]).toBeCloseTo((-15 + 20) / 2);
				expect(mergedBoundingBox.xExtent).toBeCloseTo(35 / 2);
				expect(mergedBoundingBox.yExtent).toBeCloseTo(35 / 2);
				expect(mergedBoundingBox.zExtent).toBeCloseTo(35 / 2);
			});

			it('merges two nonintersecting boxes', function() {
				boundingBox1 = new BoundingBox(new Vector3(-10, -10, -10), 5, 5, 5);
				boundingBox2 = new BoundingBox(new Vector3(20, 20, 20), 10, 10, 10);

				var mergedBoundingBox = boundingBox1.merge(boundingBox2);
				expect(mergedBoundingBox.center.data[0]).toBeCloseTo((-15 + 30) / 2);
				expect(mergedBoundingBox.center.data[1]).toBeCloseTo((-15 + 30) / 2);
				expect(mergedBoundingBox.center.data[2]).toBeCloseTo((-15 + 30) / 2);
				expect(mergedBoundingBox.xExtent).toBeCloseTo(45 / 2);
				expect(mergedBoundingBox.yExtent).toBeCloseTo(45 / 2);
				expect(mergedBoundingBox.zExtent).toBeCloseTo(45 / 2);
			});
		});

		describe('intersects', function() {
			it('intersects a bounding box', function() {
				var boundingBox1 = new BoundingBox(new Vector3(0, 0, 0), 10, 10, 10);
				var boundingBox2 = new BoundingBox(new Vector3(20, 20, 20), 11, 11, 11);

				expect(boundingBox1.intersects(boundingBox2)).toBeTruthy();
			});

			it('does not intersect a bounding box', function() {
				var boundingBox1 = new BoundingBox(new Vector3(0, 0, 0), 10, 10, 10);
				var boundingBox2 = new BoundingBox(new Vector3(20, 20, 20), 9, 11, 11);

				expect(boundingBox1.intersects(boundingBox2)).toBeFalsy();
			});

			it('intersects a bounding sphere', function() {
				var boundingBox = new BoundingBox(new Vector3(0, 0, 0), 10, 10, 10);
				var boundingSphere = new BoundingSphere(new Vector3(20, 20, 0), 15);

				expect(boundingBox.intersects(boundingSphere)).toBeTruthy();
			});

			it('does not intersect a bounding sphere', function() {
				var boundingBox = new BoundingBox(new Vector3(0, 0, 0), 10, 10, 10);
				var boundingSphere = new BoundingSphere(new Vector3(20, 20, 0), 12);
				// the distance between bounding box and the bounding sphere should be 12 - sqrt(10*10*2) < 0

				expect(boundingBox.intersects(boundingSphere)).toBeFalsy();
			});
		});
	});
});
