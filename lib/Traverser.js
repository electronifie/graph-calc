var _ = require('lodash');

var Traverser = function (options) {
  options = options || {};

  this.depthFirst = !!options.depthFirst;

  this.path = options.path || null;

  this.onlyNodeTypes = (options.onlyNodeTypes || []).length && _.indexBy(options.onlyNodeTypes);
  this.onlyEdgeTypes = (options.onlyEdgeTypes || []).length && _.indexBy(options.onlyEdgeTypes);

  this.excludeNodeTypes = (options.excludeNodeTypes || []).length && _.indexBy(options.excludeNodeTypes);
  this.excludeEdgeTypes = (options.excludeEdgeTypes || []).length && _.indexBy(options.excludeEdgeTypes);

  this.maxDepth = options.maxDepth || Infinity;
  this.allowLoops = options.allowLoops || false;

  this.onVisitNode = options.onVisitNode || function (node, meta) { /* no-op */ };
  this.onTraverseEdge = options.onTraverseEdge || function (edge, meta) { /* no-op */ };

  this.shouldVisitNode = options.shouldVisitNode || function (node, path) { return true; /* no-op */ };
  this.shouldTraverseEdge = options.shouldTraverseEdge || function (edge, path) { return true; /* no-op */ };

};

Traverser.prototype._visit = function (node, memo, meta) {
  // Depth is measured in nodes, but path includes both nodes and edges
  meta.depth = meta.path.length / 2;
  meta.viaEdge = meta.depth > 0 ? meta.path[meta.path.length - 1] : undefined;

  if (meta.viaEdge) {
    var edge = meta.viaEdge;
    memo.edges.push(edge);
    memo.json.edges.push(edge.toJson());
    this.onTraverseEdge(edge);
  }

  this.onVisitNode(node, meta);

  if (!meta.previouslyVisited) {
    memo.nodes.push(node);
    memo.json.nodes.push(node.toJson());
  }
};

Traverser.prototype.traverse = function (node) {
  var memo = { nodes: [], edges: [], json: { nodes: [], edges: [] } };
  var visited = {};

  var toVisit = [{ node: node, path: [] }];

  while (toVisit.length > 0) {
    var info = toVisit.shift();
    var currentNode = info.node;
    var currentPath = info.path;
    var previouslyVisited = !!visited[currentNode.id];

    // Don't descend beyond max depth
    if (((currentPath.length + 1) / 2) > this.maxDepth) continue;

    visited[currentNode.id] = true;
    this._visit(currentNode, memo, { path: currentPath, previouslyVisited: previouslyVisited });

    // Cycle prevention
    if ((!this.allowLoops) && previouslyVisited) continue;

    // Queue adjacent nodes
    currentNode.edges.forEach(function (edge) {
      var nextPath = currentPath.concat([currentNode, edge]);
      if (this._shouldSkipEdge(edge, _.clone(nextPath))) return;
      var nextNode = edge.toNode;
      toVisit.push({ node: nextNode, path: nextPath });
    }.bind(this));
  }

  return memo;
};

Traverser.prototype._shouldSkipEdge = function (edge, path) {
  var toNode = edge.toNode;
  if (this.excludeEdgeTypes && this.excludeEdgeTypes[edge.type]) return true;
  if (this.excludeNodeTypes && this.excludeNodeTypes[toNode.type]) return true;
  if (this.onlyEdgeTypes && !this.onlyEdgeTypes[edge.type]) return true;
  if (this.onlyNodeTypes && !this.onlyNodeTypes[toNode.type]) return true;
  if (!this.shouldVisitNode(toNode, path)) return true;
  if (!this.shouldTraverseEdge(edge, path)) return true;
  return false;
};

module.exports = Traverser;
