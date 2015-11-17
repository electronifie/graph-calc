var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Node = function (options) {
  options = options || {};

  this.edges = [];

  // Expected on object
  this.id || this._missingAbstractVar('id');

  // Expected on prototype
  this.type || this._missingAbstractVar('prototype.type');

  EventEmitter.call(this);
};

util.inherits(Node, EventEmitter);

Node.prototype.getUniqueId = function () { throw new Error('unimplemented'); };

Node.prototype.addEdge = function (edge) {
  this.edges.push(edge);
  this.emit('added-edge', edge);
  this.emit('added-edge-' + edge.type, edge);
};

Node.prototype.update = function (raw) { /* no-op */ };

Node.prototype.extendJson = function () { return {}; /* no-op */ };

Node.prototype.getGraph = function (options, graphMemo) {
  options = options || {};
  var memo = { nodes: {}, edges: {} };
  this._visit(options, memo);
  return {
    selectedId: this.id,
    nodes: _.values(memo.nodes),
    edges: _.values(memo.edges)
  }
};

Node.prototype.toJson = function () {
  return _.extend({
    id: this.id,
    name: this.name || this.id,
    type: this.type
  }, this.extendJson());
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
