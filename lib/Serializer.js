var Serializer = function (options) {
  options = options || {};

  this.onlyNodeTypes = options.onlyNodeTypes || null;
  this.onlyEdgeTypes = options.onlyEdgeTypes || null;
  this.excludeNodeTypes = options.excludeNodeTypes || [];
  this.excludeEdgeTypes = options.excludeEdgeTypes || [];
  this.shouldIncludeNode = options.shouldIncludeNode || function (node) { return true; };
  this.shouldIncludeEdge = options.shouldIncludeEdge || function (edge) { return true; };
};

Serializer.prototype.serialize = function (graph) {
  return {
    edges: graph.factory.getEdges().map(function (edge) { return edge.toJson(); }),
    nodes: graph.factory.getNodes().map(function (node) { return node.toJson(); })
  }
};

module.exports = Serializer;
