var _ = require('lodash');
var Collection = require('./Collection');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Factory = function (options) {
  this.nodeCollections =
    _.chain(options.nodeClasses)
      .map(function (nodeClass) {
        return new Collection({ Class: nodeClass, factory: this });
      }.bind(this))
      .indexBy(function (collection) { return collection.classType })
      .value();

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

Factory.prototype.createOrUpdateNode = function (nodeType, raw) {
  if (!this.nodeCollections[nodeType]) throw new Error('Unknown Node type:' + nodeType);
  return this.nodeCollections[nodeType].createOrUpdate(raw);
};

Factory.prototype.createOrUpdateEdge = function (edgeType, raw) {
  if (!this.edgeCollections[edgeType]) throw new Error('Unknown Edge type:' + edgeType);
  return this.edgeCollections[edgeType].createOrUpdate(raw);
};

Factory.prototype.getNode = function (nodeType, id) {
  var collection = this.nodeCollections[nodeType];
  if (!collection) throw new Error('Unknown node type: ' + nodeType);
  return collection.get(id);
};

Factory.prototype.getEdge = function (edgeType, id) {
  var collection = this.edgeCollections[edgeType];
  if (!collection) throw new Error('Unknown edge type: ' + edgeType);
  return collection.get(id);
};

Factory.prototype.getNodes = function (nodeType) {
  if (nodeType) {
    if (!this.nodeCollections[nodeType]) throw new Error('Unknown Node type: ' + nodeType);

    return this.nodeCollections[nodeType].getAll();
  } else {
    return _.chain(this.nodeCollections).values().map(function (collection) { return collection.getAll() }).flatten().value();
  }
};

Factory.prototype.getEdges = function (edgeType) {
  if (edgeType) {
    if (!this.edgeCollections[edgeType]) throw new Error('Unknown Edge type: ' + edgeType);

    return this.edgeCollections[edgeType].getAll();
  } else {
    return _.chain(this.edgeCollections).values().map(function (collection) { return collection.getAll() }).flatten().value();
  }
};

module.exports = Factory;
