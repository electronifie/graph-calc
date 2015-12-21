var _ = require('lodash');
var Collection = require('./Collection');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * A factory for creating (and retrieving) Nodes and Edges.
 *
 * @constructor
 * @param {Object} options
 * @param {Array.<function():Node>} options.nodeClasses an array of {@link Node} constructors.
 * @param {Array.<function():Edge>} options.edgeClasses an array of {@link Edge} constructors.
 */
var Factory = function (options) {
  /** @type {Array.<function():Node>} */
  this.nodeClasses = options.nodeClasses;

  /** @type {Array.<function():Edge>} */
  this.edgeClasses = options.edgeClasses;

  /** @type {Object.<NodeType, Collection>} */
  this.nodeCollections =
    _.chain(options.nodeClasses)
      .map(function (nodeClass) {
        return new Collection({ Class: nodeClass, factory: this });
      }.bind(this))
      .indexBy(function (collection) { return collection.classType })
      .value();

  /** @type {Object.<EdgeType, Collection>} */
  this.edgeCollections =
    _.chain(options.edgeClasses)
      .map(function (edgeClass) {
        return new Collection({ Class: edgeClass, factory: this });
      }.bind(this))
      .indexBy(function (collection) { return collection.classType })
      .value();

  _.each(this.nodeCollections, function (nodeCollection) {
    nodeCollection.on('created', function (node) {
      this.emit('created-node', node);
      this.emit('created-node-' + node.type, node);
    }.bind(this));
  }.bind(this));

  _.each(this.edgeCollections, function (edgeCollection) {
    edgeCollection.on('created', function (edge) {
      this.emit('created-edge', edge);
      this.emit('created-edge-' + edge.type, edge);
    }.bind(this));
  }.bind(this));

  EventEmitter.call(this);
};

util.inherits(Factory, EventEmitter);

/**
 * Create and retrieve a Node, or update it if it already exists.
 *
 * @param {NodeType} nodeType the type of node to create.
 * @param {Object} raw params for creating the node.
 * @return {Node}
 */
Factory.prototype.createOrUpdateNode = function (nodeType, raw) {
  if (!this.nodeCollections[nodeType]) throw new Error('Unknown Node type:' + nodeType);
  return this.nodeCollections[nodeType].createOrUpdate(raw);
};

/**
 * Create and retrieve an Edge, or update it if it already exists.
 *
 * @param {EdgeType} edgeType the type of edge to create.
 * @param {Object} raw params for creating the edge.
 * @return {Edge}
 */
Factory.prototype.createOrUpdateEdge = function (edgeType, raw) {
  if (!this.edgeCollections[edgeType]) throw new Error('Unknown Edge type:' + edgeType);
  return this.edgeCollections[edgeType].createOrUpdate(raw);
};

/**
 * Get a Node.
 *
 * @param {NodeType} nodeType
 * @param {NodeId} id
 * @returns {Node}
 */
Factory.prototype.getNode = function (nodeType, id) {
  var collection = this.nodeCollections[nodeType];
  if (!collection) throw new Error('Unknown node type: ' + nodeType);
  return collection.get(id);
};

/**
 * Get an Edge.
 *
 * @param {EdgeType} edgeType
 * @param {EdgeId} id
 * @returns {Edge}
 */
Factory.prototype.getEdge = function (edgeType, id) {
  var collection = this.edgeCollections[edgeType];
  if (!collection) throw new Error('Unknown edge type: ' + edgeType);
  return collection.get(id);
};

/**
 * Return all nodes, optionally of a given type.
 *
 * @param {NodeType=} nodeType
 * @returns {Node[]}
 */
Factory.prototype.getNodes = function (nodeType) {
  if (nodeType) {
    if (!this.nodeCollections[nodeType]) throw new Error('Unknown Node type: ' + nodeType);

    return this.nodeCollections[nodeType].getAll();
  } else {
    return _.chain(this.nodeCollections).values().map(function (collection) { return collection.getAll() }).flatten().value();
  }
};

/**
 * Return all edges, optionally of a given type.
 *
 * @param {EdgeType=} edgeType
 * @returns {Edge[]}
 */
Factory.prototype.getEdges = function (edgeType) {
  if (edgeType) {
    if (!this.edgeCollections[edgeType]) throw new Error('Unknown Edge type: ' + edgeType);

    return this.edgeCollections[edgeType].getAll();
  } else {
    return _.chain(this.edgeCollections).values().map(function (collection) { return collection.getAll() }).flatten().value();
  }
};

module.exports = Factory;
