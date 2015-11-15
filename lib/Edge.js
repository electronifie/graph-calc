var _ = require('lodash');

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
};

Edge.prototype.getUniqueId = function () { throw new Error('unimplemented'); };

Edge.prototype.update = function (raw) { /* no-op */ };

Edge.prototype.extendJson = function () { return {}; /* no-op */ };

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
