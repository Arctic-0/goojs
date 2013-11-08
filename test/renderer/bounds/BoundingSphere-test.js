define([
	'goo/renderer/bounds/BoundingBox',
	'goo/renderer/bounds/BoundingSphere',
	'goo/math/Vector3'
], function(
	BoundingBox,
	BoundingSphere,
	Vector3
) {
	'use strict';

	describe('BoundingSphere', function() {
		describe('merge', function() {
			it('merges two identical overlapping spheres', function() {
				var boundingSphere1 = new BoundingSphere(new Vector3(3, 2, 1), 5);
				var boundingSphere2 = new BoundingSphere(new Vector3(3, 2, 1), 2);

				var mergedBoundingSphere = boundingSphere1.merge(boundingSphere2);
				expect(mergedBoundingSphere.center.data[0]).toBeCloseTo(3);
				expect(mergedBoundingSphere.center.data[1]).toBeCloseTo(2);
				expect(mergedBoundingSphere.center.data[2]).toBeCloseTo(1);
				expect(mergedBoundingSphere.radius).toBeCloseTo(5);
			});

			it('merges two intersecting spheres', function() {
				var boundingSphere1 = new BoundingSphere(new Vector3(-20, 0, 0), 4);
				var boundingSphere2 = new BoundingSphere(new Vector3( 10, 0, 0), 8);

				var mergedBoundingSphere = boundingSphere1.merge(boundingSphere2);
				expect(mergedBoundingSphere.center.data[0]).toBeCloseTo((-20-4 + 10+8) / 2);
				expect(mergedBoundingSphere.center.data[1]).toBeCloseTo(0);
				expect(mergedBoundingSphere.center.data[2]).toBeCloseTo(0);
				expect(mergedBoundingSphere.radius).toBeCloseTo((10+8 - (-20-4)) / 2);
			});
		});

		describe('intersects', function() {
			it('intersects a bounding box', function() {
				var boundingSphere = new BoundingSphere(new Vector3(20, 20, 0), 12);
				var boundingBox = new BoundingBox(new Vector3(0, 0, 0), 10, 10, 10);

				expect(boundingSphere.intersects(boundingBox)).toBeTruthy();
			});

			it('does not intersect a bounding box', function() {
				var boundingSphere = new BoundingSphere(new Vector3(20, 20, 0), 12);
				var boundingBox = new BoundingBox(new Vector3(0, 0, 0), 10, 10, 10);
				// the distance between bounding box and the bounding sphere should be 12 - sqrt(10*10*2) > 0

				expect(boundingSphere.intersects(boundingBox)).toBeFalsy();
			});

			it('intersects a bounding sphere', function() {
				var boundingSphere1 = new BoundingSphere(new Vector3(2 * 1, 3 * 1, 6 * 1), 7);
				var boundingSphere2 = new BoundingSphere(new Vector3(2 * 3, 3 * 3, 6 * 3), 7);

				expect(boundingSphere1.intersects(boundingSphere2)).toBeTruthy();
			});

			it('does not intersect a bounding sphere', function() {
				var boundingSphere1 = new BoundingSphere(new Vector3(2 * 1, 3 * 1, 6 * 1), 6);
				var boundingSphere2 = new BoundingSphere(new Vector3(2 * 3, 3 * 3, 6 * 3), 7);

				expect(boundingSphere1.intersects(boundingSphere2)).toBeFalsy();
			});
		});
	});
});
