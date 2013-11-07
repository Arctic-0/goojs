define([
	'goo/scripts/HeightMapBoundingScript'
], function(
	HeightMapBoundingScript
	) {
	'use strict';



	describe('Build a basic heightmap and check basic points', function() {
		it ('adds a simple heightmap gets its height values', function() {

			var heightMatrix = [[0, 0, 0, 0], [0, 0.5, 0.5, 0], [0.5, 1, 1, 0.5], [1, 1, 1, 1]];

			var heightMapScript = new HeightMapBoundingScript(heightMatrix);
			var height = heightMapScript.getAt(0, 0);
			expect(height).toEqual(0);
			height = heightMapScript.getAt(0, 1);
			expect(height).toEqual(0);
			height = heightMapScript.getAt(1, 1);
			expect(height).toEqual(0.5);
			height = heightMapScript.getAt(1, 0);
			expect(height).toEqual(0);

			height = heightMapScript.getInterpolated(0.5, 0.5);
			expect(height).toEqual(0.125);
			height = heightMapScript.getInterpolated(0.25, 0.75);
			expect(height).toEqual(0.09375);
			height = heightMapScript.getInterpolated(1.5, 1);
			expect(height).toEqual(0.75);
			height = heightMapScript.getInterpolated(2.5, 1);
			expect(height).toEqual(1);
		});

		it ('looks for positions outside default dimensions', function() {

		});
	});
});
