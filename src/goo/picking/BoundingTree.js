define(['goo/renderer/bounds/BoundingBox', 'goo/renderer/bounds/BoundingSphere', 'goo/math/Vector3'],
/** @lends */
function (BoundingBox, BoundingSphere, Vector3) {
	"use strict";

	function BoundingTree (boundType) {
		this.leftTree = null;
		this.rightTree = null;
		this.localBound = null;
		this.worldBound = null;

		this.boundType = boundType ? boundType : BoundingTree.BOUNDTYPE_BOX;
	}

	BoundingTree.BOUNDTYPE_SPHERE = "sphere";
	BoundingTree.BOUNDTYPE_BOX = "box";

	BoundingTree.MAX_PRIMITIVES_PER_LEAF = 16;

	BoundingTree.prototype.construct = function (entity) {
		// check entity has required components
		if (!entity.meshRendererComponent || !entity.meshDataComponent || !entity.transformComponent) {
			console.warn("Entity missing required components for boundingtree construction: ", entity);
			return;
		}

		var meshData = entity.meshDataComponent.meshData;
		// XXX: updatePrimitiveCounts could potentially be done as needed in MeshData instead.
		meshData.updatePrimitiveCounts();
		if (meshData.getSectionCount() === 1) {
			this.primitiveIndices = [];
			// REVIEW: Is there a better way to do this?
			for ( var i = 0, max = meshData.getPrimitiveCount(0); i < max; i++) {
				this.primitiveIndices.push(i);
			}
			this.createTree(entity, 0, 0, this.primitiveIndices.length);
		} else {
			// REVIEW: This doesn't exist?
			this.split(entity, 0, meshData.getSectionCount());
		}
	};

	BoundingTree.prototype.createTree = function (entity, section, start, end) {
		start = Math.floor(start);
		end = Math.floor(end);

		var meshData = entity.meshDataComponent.meshData;

		this.section = section;
		this.start = start;
		this.end = end;

		if (!this.primitiveIndices) {
			return;
		}

		this.createBounds();

		// the bounds at this level should contain all the primitives this level is responsible for.
		this.localBound.computeFromPrimitives(meshData, section, this.primitiveIndices, start, end);

		// check to see if we are a leaf, if the number of primitives we reference is less than or equal to the maximum
		// defined by the CollisionTreeManager we are done.
		if (end - start + 1 <= BoundingTree.MAX_PRIMITIVES_PER_LEAF) {
			return;
		}

		// create the left child
		if (!this.leftTree) {
			this.leftTree = new BoundingTree(this.boundType);
		}
		this.leftTree.primitiveIndices = this.primitiveIndices;
		this.leftTree.createTree(entity, section, start, (start + end) / 2);

		// create the right child
		if (!this.rightTree) {
			this.rightTree = new BoundingTree(this.boundType);
		}
		this.rightTree.primitiveIndices = this.primitiveIndices;
		this.rightTree.createTree(entity, section, (start + end) / 2, end);
	};

	BoundingTree.prototype.createBounds = function () {
		switch (this.boundType) {
			case BoundingTree.BOUNDTYPE_BOX:
				this.localBound = new BoundingBox();
				this.worldBound = new BoundingBox();
				break;
			case BoundingTree.BOUNDTYPE_SPHERE:
				this.localBound = new BoundingSphere();
				this.worldBound = new BoundingSphere();
				break;
			default:
				break;
		}
	};

	BoundingTree.prototype.findPick = function (ray, entity, store) {
		var result = store;
		if (!result) {
			result = {};
		}

		var worldTransform = entity.transformComponent.worldTransform;
		this.localBound.transform(worldTransform, this.worldBound);

		// if our ray doesn't hit the bounds, then it must not hit a primitive.
		if (!this.worldBound.intersectsRay(ray)) {
			return result;
		}

		// This is not a leaf node, therefore, check each child (left/right) for intersection with the ray.
		if (this.leftTree) {
			this.leftTree.findPick(ray, entity, result);
		}

		if (this.rightTree) {
			this.rightTree.findPick(ray, entity, result);
		} else if (!this.leftTree) {
			// This is a leaf node. We can therefore check each primitive this node contains. If an intersection occurs, place it in the list.
			var data = entity.meshDataComponent.meshData;

			var points = null;
			for ( var i = this.start; i < this.end; i++) {
				points = data.getPrimitiveVertices(this.primitiveIndices[i], this.section, points);
				for ( var t = 0; t < points.length; t++) {
					worldTransform.matrix.applyPostPoint(points[t]);
				}
				var vecStore = new Vector3();
				if (ray.intersects(points, false, vecStore)) {
					result.distances = result.distances || [];
					result.distances.push(ray.origin.distance(vecStore));
					result.points = result.points || [];
					result.points.push(vecStore);

					// result.hits = result.hits || [];
					// result.hits.push({
					// 	distance: ray.origin.distance(vecStore),
					// 	point: vecStore
					// });
				}
			}
		}

		// if (result.hits) {
		// 	result.hits.sort(function (a, b) {
		// 		return a.distance - b.distance;
		// 	});
		// }

		return result;
	};

	return BoundingTree;
});