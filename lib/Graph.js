var Graph = function (options) {
  this.factory = options.factory;
};

Graph.prototype.getFullGraph = function (options) {
  return {
    edges: this.factory.getEdges().map(function (edge) { return edge.toJson() }),
    nodes: this.factory.getNodes().map(function (node) { return node.toJson() })
  }
};

module.exports = Graph;
