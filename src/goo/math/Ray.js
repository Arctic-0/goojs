define(['goo/math/Vector3', 'goo/math/MathUtils'],
	/** @lends Ray */
	function (Vector3, MathUtils) {
	"use strict";

	/**
	 * @class Constructs a new ray with an origin at (0,0,0) and a direction of (0,0,1).
	 */
	function Ray(origin, direction) {
		this.origin = origin || new Vector3();
		this.direction = direction || new Vector3().copy(Vector3.UNIT_Z);
	}

	/**
	 * Check for intersection of this ray and and a quad or triangle, either just inside the shape or for the plane defined by the shape (doPlanar ==
	 * true)
	 *
	 * @param polygonVertices 3 or 4 vector3s defining a triangle or quad
	 * @param [doPlanar]
	 * @param locationStore Vector3 to store our intersection point in.
	 * @return true if this ray intersects a polygon described by the given vertices.
	 */
	Ray.prototype.intersects = function (polygonVertices, doPlanar, locationStore) {
		if (polygonVertices.length === 3) {
			return this.intersectsTriangle(polygonVertices[0], polygonVertices[1], polygonVertices[2], doPlanar, locationStore);
		} else if (polygonVertices.length === 4) {
			return this.intersectsTriangle(polygonVertices[0], polygonVertices[1], polygonVertices[2], doPlanar, locationStore)
				|| this.intersectsTriangle(polygonVertices[0], polygonVertices[2], polygonVertices[3], doPlanar, locationStore);
		}
		return false;
	};

	/**
	 * Ray vs triangle implementation.
	 *
	 * @param pointA First
	 * @param pointB
	 * @param pointC
	 * @param [doPlanar]
	 * @param [locationStore]
	 * @return true if this ray intersects a triangle formed by the given three points.
	 */
	Ray.prototype.intersectsTriangle = function (pointA, pointB, pointC, doPlanar, locationStore) {
		var diff = new Vector3().set(this.origin).subtractLocal(pointA);
		var edge1 = new Vector3().set(pointB).subtractLocal(pointA);
		var edge2 = new Vector3().set(pointC).subtractLocal(pointA);
		var norm = new Vector3().set(edge1).crossLocal(edge2);

		var dirDotNorm = this.direction.dot(norm);
		var sign;
		if (dirDotNorm > MathUtils.EPSILON) {
			sign = 1.0;
		} else if (dirDotNorm < -MathUtils.EPSILON) {
			sign = -1.0;
			dirDotNorm = -dirDotNorm;
		} else {
			// ray and triangle/quad are parallel
			return false;
		}

		var dirDotDiffxEdge2 = sign * this.direction.dot(diff.cross(edge2, edge2));
		var result = false;
		if (dirDotDiffxEdge2 >= 0.0) {
			var dirDotEdge1xDiff = sign * this.direction.dot(edge1.crossLocal(diff));
			if (dirDotEdge1xDiff >= 0.0) {
				if (dirDotDiffxEdge2 + dirDotEdge1xDiff <= dirDotNorm) {
					var diffDotNorm = -sign * diff.dot(norm);
					if (diffDotNorm >= 0.0) {
						// ray intersects triangle
						// if storage vector is null, just return true,
						if (!locationStore) {
							return true;
						}
						// else fill in.
						var inv = 1.0 / dirDotNorm;
						var t = diffDotNorm * inv;
						if (!doPlanar) {
							locationStore.set(this.origin).addLocal(this.direction.getX() * t, this.direction.getY() * t, this.direction.getZ() * t);
						} else {
							// these weights can be used to determine
							// interpolated values, such as texture coord.
							// eg. texcoord s,t at intersection point:
							// s = w0*s0 + w1*s1 + w2*s2;
							// t = w0*t0 + w1*t1 + w2*t2;
							var w1 = dirDotDiffxEdge2 * inv;
							var w2 = dirDotEdge1xDiff * inv;
							// float w0 = 1.0 - w1 - w2;
							locationStore.set(t, w1, w2);
						}
						result = true;
					}
				}
			}
		}
		return result;
	};

	/**
     * @param worldVertices an array (size 3 or 4) of vectors describing a polygon
     * @return the distance from our origin to the primitive or Infinity if we do not intersect.
     */
    Ray.prototype.getDistanceToPrimitive = function (worldVertices) {
        // Intersection test
        var intersect = new Vector3();
        if (this.intersects(worldVertices, false, intersect)) {
            return this.origin.distance(intersect.x, intersect.y, intersect.z);
        }
        return Infinity;
    };
	

    /**
     * @param plane
     * @param locationStore
     *            if not null, and this ray intersects the plane, the world location of the point of intersection is
     *            stored in this vector.
     * @return true if the ray collides with the given Plane
     */
    Ray.prototype.intersectsPlane = function (plane, locationStore) {
		var normal = plane.normal;
		var denominator = normal.dot(this.direction);

		if (Math.abs(denominator) < 0.00001) {
			return false; // coplanar
		}

		var numerator = -normal.dot(this.origin) + plane.constant;
		var ratio = numerator / denominator;

		if (ratio < 0.00001) {
			return false; // intersects behind origin
		}

		if (locationStore != null) {
			locationStore.set(this.direction).multiplyLocal(ratio).addLocal(
					this.origin);
		}

		return true;
    };

    /**
	 * @param point
	 *            Vector3
	 * @param store
	 *            if not null, the closest point is stored in this param
	 * @return the squared distance from this ray to the given point.
	 */
    Ray.prototype.distanceSquared = function (point, store) {
		var vectorA = new Vector3();
		vectorA.set(point).subtractLocal(this.origin);
		var t0 = this.direction.dot(vectorA);
		if (t0 > 0) {
			// d = |P - (O + t*D)|
			vectorA.set(this.direction).multiplyLocal(t0);
			vectorA.addLocal(this.origin);
		} else {
			// ray is closest to origin point
			vectorA.set(this.origin);
		}

		// Save away the closest point if requested.
		if (store != null) {
			store.set(vectorA);
		}

		point.subtract(vectorA, vectorA);
		return vectorA.lengthSquared();
    };

	return Ray;
});