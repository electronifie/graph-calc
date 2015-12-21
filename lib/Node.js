var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Node instances should be created using {@link Factory#createOrUpdateEdge}.
 *
 * @abstract
 * @class
 * @extends {EventEmitter}
 */
var Node = function () {
  /**
   * @type {Edge[]}
   */
  this.edges = [];

  /**
   * @typedef {String} NodeId
   */

  /**
   * @abstract
   * @type {NodeId}
   */
  this.id || this._missingAbstractVar('id');

  /**
   * @typedef {String} NodeType
   */

  /**
   * @abstract
   * @type {NodeType}
   */
  this.type || this._missingAbstractVar('prototype.type');

  // There's going to be a lot of 'deleted' listeners
  this.setMaxListeners(100);

  EventEmitter.call(this);
};

util.inherits(Node, EventEmitter);

/**
 * Add an edge to the node.
 *
 * @param {Edge} edge
 */
Node.prototype.addEdge = function (edge) {
  this.edges.push(edge);
  edge.on('deleted', this._removeEdge.bind(this));
  this.emit('added-edge', edge);
  this.emit('added-edge-' + edge.type, edge);
};

/**
 * Update the Node's data.
 *
 * @abstract
 * @param {Object} raw
 */
Node.prototype.update = function (raw) { /* no-op */ };

/**
 * Hook for children to provide additional fields in the {@link Node#toJson} response.
 *
 * @abstract
 * @returns {Object}
 */
Node.prototype.extendJson = function () { return {}; /* no-op */ };

/**
 * Delete the node.
 *
 * Will also delete all edges attached to the node.
 */
Node.prototype.delete = function () {
  this.edges.forEach(function (edge) { edge.removeListener('deleted', this._removeEdge.bind(this)); }.bind(this));
  this.emit('pre-deleted', this);
  this.emit('deleted', this);
  this.removeAllListeners();
};

/**
 * Get a JSON representation of the Node.
 *
 * @returns {NodeJson}
 */
Node.prototype.toJson = function () {
  /**
   * @typedef {Object} NodeJson
   * @property {NodeId} id
   * @property {String} name
   * @property {String} type
   */
  return _.extend({
    id: this.id,
    name: this.name || this.id,
    type: this.type
  }, this.extendJson());
};

Node.prototype._removeEdge = function (edgeToRemove) {
  this.edges = _.filter(this.edges, function (edge) { return edge.id !== edgeToRemove.id; });
};

Node.prototype._visit = function (options, memo) {
  if (memo.nodes[this.id]) return;
  memo.nodes[this.id] = this.toJson();
  this.edges.forEach(function (edge) {
    memo.edges[edge.id] = edge.toJson();
    var toNode = edge.toNode;
    toNode._visit(options, memo);
  });

  return memo;
};

Node.prototype._missingAbstractVar = function (name) { throw new Error('Unimplemented var: ' + name); };

module.exports = Node;
