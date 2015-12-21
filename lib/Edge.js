var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Edge instances should be created with {@link Factory#createOrUpdateEdge}.
 *
 * @abstract
 * @class
 * @extends {EventEmitter}
 */
var Edge = function () {

  /**
   * @typedef {String} EdgeId
   */

  /**
   * @abstract
   * @type {EdgeId}
   */
  this.id || this._missingAbstractVar('id');

  /**
   * @abstract
   * @type {Node}
   */
  this.fromNode || this._missingAbstractVar('fromNode');

  /**
   * @abstract
   * @type {Node}
   */
  this.toNode || this._missingAbstractVar('toNode');

  /**
   * @typedef {String} EdgeType
   */

  /**
   * @abstract
   * @type {EdgeType}
   */
  this.type || this._missingAbstractVar('prototype.type');

  /**
   * @abstract
   * @type {NodeType}
   */
  this.fromNodeType || this._missingAbstractVar('prototype.fromNodeType');

  /**
   * @abstract
   * @type {NodeType}
   */
  this.toNodeType || this._missingAbstractVar('prototype.toNodeType');

  if (this.fromNode.type !== this.fromNodeType) throw new Error('Invalid fromNode type. Got "' + this.fromNode.type + '", expected "' + this.fromNodeType + '"');
  if (this.toNode.type !== this.toNodeType) throw new Error('Invalid toNode type. Got "' + this.toNode.type + '", expected "' + this.toNodeType + '"');

  this.fromNode.addEdge(this);

  this.deleteListener = this.delete.bind(this);

  this.toNode.on('pre-deleted', this.deleteListener);
  this.fromNode.on('pre-deleted', this.deleteListener);

  // There's going to be a lot of 'deleted' listeners
  this.setMaxListeners(100);

  EventEmitter.call(this);
};

util.inherits(Edge, EventEmitter);

/**
 * Update the Edge's data.
 *
 * @abstract
 * @param {Object} raw
 */
Edge.prototype.update = function (raw) { /* no-op */ };

/**
 * Hook for children to provide additional fields in the {@link Edge#toJson} response.
 *
 * @abstract
 * @returns {Object}
 */
Edge.prototype.extendJson = function () { return {}; /* no-op */ };

/**
 * Delete the edge.
 *
 * Will also remove the edge from all connected nodes.
 */
Edge.prototype.delete = function () {
  this.toNode.removeListener('pre-deleted', this.deleteListener);
  this.fromNode.removeListener('pre-deleted', this.deleteListener);
  this.emit('pre-deleted', this);
  this.emit('deleted', this);
  this.removeAllListeners();
};

/**
 * Get a JSON representation of the Edge.
 *
 * @returns {EdgeJson}
 */
Edge.prototype.toJson = function () {
  /**
   * @typedef {Object} EdgeJson
   * @property {EdgeId} id
   * @property {String} name
   * @property {String} type
   * @property {NodeId} from
   * @property {NodeId} to
   */
  return _.extend({
    id: this.id,
    name: this.name || this.id,
    type: this.type,
    from: this.fromNode.id,
    to: this.toNode.id
  }, this.extendJson());
};

Edge.prototype._missingAbstractVar = function (name) { throw new Error('Unimplemented var: ' + name); };

module.exports = Edge;
