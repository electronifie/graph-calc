var _ = require('lodash');

/**
 * @constructor
 * @param {Object} options
 * @param {NodeType[]} [options.onlyNodeTypes]
 * @param {EdgeType[]} [options.onlyEdgeTypes]
 * @param {NodeType[]} [options.excludeNodeTypes]
 * @param {EdgeType[]} [options.excludeEdgeTypes]
 * @param {Serializer.ShouldIncludeNodeCb} [options.shouldIncludeNode]
 * @param {Serializer.ShouldIncludeEdgeCb} [options.shouldIncludeEdge]
 */
var Serializer = function (options) {
  options = options || {};

  /**
   * @type {NodeType[]|null}
   */
  this.onlyNodeTypes = options.onlyNodeTypes || null;

  /**
   * @type {EdgeType[]|null}
   */
  this.onlyEdgeTypes = options.onlyEdgeTypes || null;

  /**
   * @type {NodeType[]|null}
   */
  this.excludeNodeTypes = options.excludeNodeTypes || null;

  /**
   * @type {EdgeType[]|null}
   */
  this.excludeEdgeTypes = options.excludeEdgeTypes || null;

  /**
   * @callback ShouldIncludeNodeCb
   * @memberof Serializer
   * @param {Node} node
   * @returns {Boolean}
   */

  /**
   * @type {Serializer.ShouldIncludeNodeCb}
   */
  this.shouldIncludeNode = options.shouldIncludeNode || function (node) { return true; };

  /**
   * @callback ShouldIncludeEdgeCb
   * @memberof Serializer
   * @param {Node} node
   * @returns {Boolean}
   */

  /**
   * @type {Serializer.ShouldIncludeEdgeCb}
   */
  this.shouldIncludeEdge = options.shouldIncludeEdge || function (edge) { return true; };
};

/**
 * Serialize a graph to JSON.
 *
 * @param {Graph} graph
 * @returns {GraphJson}
 */
Serializer.prototype.serialize = function (graph) {

  var nodeTypesToInclude = {}; // micro-optimization for lookup in determining edgeTypesToInclude
  var edgeTypesToInclude = [];

  graph.factory.nodeClasses.forEach(function (NodeClass) {
    var type = NodeClass.type || NodeClass.prototype.type;

    var include =
      ! (
        // reasons for exclusion
        (this.onlyNodeTypes && !_.contains(this.onlyNodeTypes, type)) ||
        (this.excludeNodeTypes && _.contains(this.excludeNodeTypes, type))
      );

    if (include) nodeTypesToInclude[type] = true;
  }.bind(this));

  graph.factory.edgeClasses.forEach(function (EdgeClass) {
    var type = EdgeClass.type || EdgeClass.prototype.type;
    var fromNodeType = EdgeClass.prototype.fromNodeType;
    var toNodeType = EdgeClass.prototype.toNodeType;

    var include =
      ! (
        // reasons for exclusion
        (this.onlyEdgeTypes && !_.contains(this.onlyEdgeTypes, type)) ||
        (this.excludeEdgeTypes && _.contains(this.excludeEdgeTypes, type)) ||
        (!nodeTypesToInclude[fromNodeType]) ||
        (!nodeTypesToInclude[toNodeType])
      );

    if (include) edgeTypesToInclude.push(type);
  }.bind(this));

  var excludedNodeIds = {};

  var nodesJson =
    _.chain(nodeTypesToInclude)
      .keys()
      .map(function (nodeType) { return graph.factory.getNodes(nodeType); })
      .flatten()
      .filter(function (node) {
        var include = this.shouldIncludeNode(node);
        if (!include) excludedNodeIds[node.id] = true;
        return include;
      }.bind(this))
      .map(function (node) { return node.toJson(); })
      .value();

  var edgesJson =
      _.chain(edgeTypesToInclude)
          .map(function (edgeType) { return graph.factory.getEdges(edgeType); })
          .flatten()
          .filter(function (edge) {
            var include =
              this.shouldIncludeEdge(edge) &&
              (! ( excludedNodeIds[edge.toNode.id] || excludedNodeIds[edge.fromNode.id] ) );
            return include
          }.bind(this))
          .map(function (edge) { return edge.toJson(); })
          .value();

  /**
   * @typedef {Object} GraphJson
   * @property {EdgeJson[]} edges
   * @property {NodeJson[]} nodes
   */
  return {
    edges: edgesJson,
    nodes: nodesJson
  }
};

module.exports = Serializer;
