define([
	'goo/math/Plane',
	'goo/math/Vector3',
	'goo/math/Ray'
], function(
	Plane,
	Vector3,
	Ray
) {
	'use strict';

	describe('Plane',function(){
		it('constructs',function(){
			var p = new Plane();
		});

		it('computes pseudodistance',function(){
			var p = new Plane();
			var dist = p.pseudoDistance(new Vector3(0,1,0));
			expect(dist).toEqual(1);
		});

		it('can set from points',function(){
			var p = new Plane();
			p.setPlanePoints(	new Vector3(1,0,0),
								new Vector3(0,1,0),
								new Vector3(0,0,0)  );
			expect(p.normal).toEqual(new Vector3(0,0,1));
		});

		it('can reflect vector',function(){
			var p = new Plane();
			var store = new Vector3();
			p.reflectVector(new Vector3(0,1,0),store);
			expect(store).toEqual(new Vector3(0,-1,0));

			// Without precreating store
			store = p.reflectVector(new Vector3(0,1,0));
			expect(store).toEqual(new Vector3(0,-1,0));
		});

		it('can ray intersect',function(){
			var p = new Plane(new Vector3(0,1,0),1);
			var ray = new Ray(new Vector3(0,0,0), new Vector3(0,1,0));
			var store = new Vector3();
			p.rayIntersect(ray,store);
			expect(store).toEqual(new Vector3(0,1,0));

			ray.direction.setd(0,0,1);
			var result = p.rayIntersect(ray,store);
			expect(result).toBe(null);
		});

	});
});
