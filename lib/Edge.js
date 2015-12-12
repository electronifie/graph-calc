var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Edge = function (options) {
  options = options || {};

  // Expected on object
  this.id || this._missingAbstractVar('id');
  this.fromNode || this._missingAbstractVar('fromNode');
  this.toNode || this._missingAbstractVar('toNode');

  // Expected on prototype
  this.type || this._missingAbstractVar('prototype.type');
  this.fromNodeType || this._missingAbstractVar('prototype.fromNodeType');
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

Edge.prototype.getUniqueId = function () { throw new Error('unimplemented'); };

Edge.prototype.update = function (raw) { /* no-op */ };

Edge.prototype.extendJson = function () { return {}; /* no-op */ };

Edge.prototype.delete = function () {
  this.toNode.removeListener('pre-deleted', this.deleteListener);
  this.fromNode.removeListener('pre-deleted', this.deleteListener);
  this.emit('pre-deleted', this);
  this.emit('deleted', this);
  this.removeAllListeners();
};

Edge.prototype.toJson = function () {
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
