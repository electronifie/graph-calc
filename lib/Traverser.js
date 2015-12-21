var _ = require('lodash');

/** @typedef {Array.<(Node|Edge)>} Path */

/**
 * Helper for traversing a {@link Graph} from a given {@link Node}.
 *
 * @constructor
 * @param {Object} [options]
 * @param {NodeType[]} [options.onlyNodeTypes] only traverse {@link Node}s of this type.
 * @param {EdgeType[]} [options.onlyEdgeTypes] only traverse {@link Edge}s of this type.
 * @param {NodeType[]} [options.excludeNodeTypes] don't traverse {@link Node}s of this type.
 * @param {EdgeType[]} [options.excludeEdgeTypes] don't traverse {@link Edge}s of this type.
 * @param {Number} [options.maxDepth=Infinity] max distance of nodes from the root node to visit.
 * @param {Boolean} [options.allowLoops=False] traverse Edges that have already been traversed. WARNING: will cause
 *   infinite loops unless special effort is taken to prevent them (e.g. with maxDepth or shouldVisit(Node|Edge).
 * @param {Traverser.ShouldVisitNodeCb} [options.shouldVisitNode] function to determine if a node should be visited.
 * @param {Traverser.ShouldTraverseEdgeCb} [options.shouldTraverseEdge] function to determine if a edge should be traversed.
 * @param {Traverser.OnVisitNodeCb} [options.onVisitNode] callback called when a node is visited.
 * @param {Traverser.OnTraverseEdgeCb} [options.onTraverseEdge] callback called when an edge is traversed.
 */
var Traverser = function (options) {
  options = options || {};

  /** @type {?Object.<NodeType,NodeType>} */
  this.onlyNodeTypes = (options.onlyNodeTypes || []).length && _.indexBy(options.onlyNodeTypes) || null;

  /** @type {?Object.<EdgeType,EdgeType>} */
  this.onlyEdgeTypes = (options.onlyEdgeTypes || []).length && _.indexBy(options.onlyEdgeTypes) || null;

  /** @type {?Object.<NodeType,NodeType>} */
  this.excludeNodeTypes = (options.excludeNodeTypes || []).length && _.indexBy(options.excludeNodeTypes) || null;

  /** @type {?Object.<EdgeType,EdgeType>} */
  this.excludeEdgeTypes = (options.excludeEdgeTypes || []).length && _.indexBy(options.excludeEdgeTypes) || null;

  /** @type {Number} */
  this.maxDepth = options.maxDepth || Infinity;

  /** @type {Boolean} */
  this.allowLoops = options.allowLoops || false;

  /**
   * @callback OnVisitNodeCb
   * @memberof Traverser
   * @param {Node} node
   * @param {Traverser.NodeTraversalMeta} meta
   * @returns {Boolean}
   */

  /** @type {OnVisitNodeCb} */
  this.onVisitNode = options.onVisitNode || function (node, meta) { /* no-op */ };

  /**
   * @callback OnTraverseEdgeCb
   * @memberof Traverser
   * @param {Edge} edge
   * @returns {Boolean}
   */

  /** @type {OnTraverseEdgeCb} */
  this.onTraverseEdge = options.onTraverseEdge || function (edge) { /* no-op */ };

  /**
   * @callback ShouldVisitNodeCb
   * @memberof Traverser
   * @param {Node} node
   * @param {Path} path
   * @returns {Boolean}
   */

  /** @type {Traverser.ShouldVisitNodeCb} */
  this.shouldVisitNode = options.shouldVisitNode || function (node, path) { return true; /* no-op */ };

  /**
   * @callback ShouldTraverseEdgeCb
   * @memberof Traverser
   * @param {Edge} edge
   * @param {Path} path
   * @returns {Boolean}
   */

  /** @type {Traverser.ShouldTraverseEdgeCb} */
  this.shouldTraverseEdge = options.shouldTraverseEdge || function (edge, path) { return true; /* no-op */ };

};

Traverser.prototype._visit = function (node, memo, meta) {
  /**
   * @typedef {Object} NodeTraversalMeta
   * @memberof Traverser
   * @property {Path} path the path from the base Node to the visited Node.
   * @property {Boolean} previouslyVisited whether the Node has been visited before (if true, no further traversals
   *   will be made down this path unless options.allowLoops is true).
   * @property {Number} distance of the base node from the visited node.
   * @property {Edge} viaEdge edge traversed to get to this node.
   */

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

/**
 * Traverse the graph from the given Node.
 *
 * @param {Node} rootNode
 * @returns {Traverser.TraversalResult}
 */
Traverser.prototype.traverse = function (rootNode) {
  var memo = { nodes: [], edges: [], json: { nodes: [], edges: [] } };
  var visited = {};

  var toVisit = [{ node: rootNode, path: [] }];

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

  /**
   * @typedef {Object} TraversalResult
   * @memberof Traverser
   * @property {Node[]} nodes
   * @property {Edge[]} edges
   * @property {GraphJson} json
   */
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
