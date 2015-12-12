var _ = require('lodash');
var Traverser = require('./Traverser');

TRAVERSER_PARAMS = ['maxDepth', 'excludeNodeTypes', 'excludeEdgeTypes', 'onlyNodeTypes', 'onlyEdgeTypes'];

// WARNING: brute force method - traverses entire network upon every change event.
// TODO: make more efficient, by only traversing the changed part of the network.
var NetworkSubscriber = function (options) {
  this.node = options.node || this._missingOptions('node');
  this.nodeEvents = options.nodeEvents || {};
  this.edgeEvents = options.edgeEvents || {};

  this.traverserOptions = _.pick(options || {}, TRAVERSER_PARAMS);

  this._discoveredNodes = {};
  this._discoveredEdges = {};

  this._nodeListeners = {};
  this._edgeListeners = {};

  this._checkNetwork();
};

NetworkSubscriber.prototype._missingOptions = function (name) { throw new Error('Missing required param: options.' + name); };

NetworkSubscriber.prototype._checkNetwork = function () {
  var result = new Traverser(this.traverserOptions).traverse(this.node);
  var visitedNodes = result.nodes;
  var visitedEdges = result.edges;

  var indexedDiscoveredNodes = _.indexBy(visitedNodes, 'id');
  var indexedDiscoveredEdges = _.indexBy(visitedEdges, 'id');

  var newDiscoveredNodeIds = _.keys(indexedDiscoveredNodes);
  var newDiscoveredEdgeIds = _.keys(indexedDiscoveredEdges);
  var oldDiscoveredNodeIds = _.keys(this._discoveredNodes);
  var oldDiscoveredEdgeIds = _.keys(this._discoveredEdges);

  var discoveredNodes = _.difference(newDiscoveredNodeIds, oldDiscoveredNodeIds);
  var discoveredEdges = _.difference(newDiscoveredEdgeIds, oldDiscoveredEdgeIds);
  var removedNodes = _.difference(oldDiscoveredNodeIds, newDiscoveredNodeIds);
  var removedEdges = _.difference(oldDiscoveredEdgeIds, newDiscoveredEdgeIds);

  _.each(discoveredNodes, function (nodeId) { this._discoveredNode(indexedDiscoveredNodes[nodeId]); }.bind(this));
  _.each(discoveredEdges, function (edgeId) { this._discoveredEdge(indexedDiscoveredEdges[edgeId]); }.bind(this));
  _.each(removedNodes, function (nodeId) { this._removedNode(nodeId); }.bind(this));
  _.each(removedEdges, function (edgeId) { this._removedEdge(edgeId); }.bind(this));
};

NetworkSubscriber.prototype._discoveredNode = function (node) {
  if (this._discoveredNodes[node.id]) throw new Error('Node ' + node.id + ' already exists in list. Something\'s gone wrong.');
  this._discoveredNodes[node.id] = node;
  if (this.nodeEvents.discovered && node.id !== this.node.id) this.nodeEvents.discovered(node);
  this._nodeListeners[node.id] = {};
  for (event in this.nodeEvents) {
    if (event !== 'discovered' || event !== 'removed') {
      this._nodeListeners[node.id][event] = this.nodeEvents[event].bind(null, node);
      node.on(event, this._nodeListeners[node.id][event]);
    }
  }
  node.on('added-edge', this._checkNetwork.bind(this));
  node.on('deleted', this._checkNetwork.bind(this));
};

NetworkSubscriber.prototype._discoveredEdge = function (edge) {
  if (this._discoveredEdges[edge.id]) throw new Error('Edge ' + edge.id + ' already exists in list. Something\'s gone wrong.');
  this._discoveredEdges[edge.id] = edge;
  if (this.edgeEvents.discovered) this.edgeEvents.discovered(edge);
  this._edgeListeners[edge.id] = {};
  for (event in this.edgeEvents) {
    if (event !== 'discovered' || event !== 'removed') {
      this._edgeListeners[edge.id][event] = this.edgeEvents[event].bind(null, edge);
      edge.on(event, this._edgeListeners[edge.id][event]);
    }
  }
};

NetworkSubscriber.prototype._removedNode = function (nodeId) {
  if (!this._discoveredNodes[nodeId]) throw new Error('Node ' + nodeId + ' does not exist in list. Something\'s gone wrong.');
  var node = this._discoveredNodes[nodeId];
  // delete should be avoided, but we use _.keys to determine discovered nodes
  delete this._discoveredNodes[nodeId];
  if (this.nodeEvents.removed) this.nodeEvents.removed(node);
  for (event in this._nodeListeners[node.id]) {
    node.removeListener(event, this._nodeListeners[node.id][event]);
    this._nodeListeners[node.id][event] = null;
  }
  this._nodeListeners[node.id] = null;
  node.removeListener('added-edge', this._checkNetwork.bind(this));
  node.removeListener('deleted', this._checkNetwork.bind(this));
};

NetworkSubscriber.prototype._removedEdge = function (edgeId) {
  if (!this._discoveredEdges[edgeId]) throw new Error('Edge ' + edgeId + ' does not exist in list. Something\'s gone wrong.');
  var edge = this._discoveredEdges[edgeId];
  // delete should be avoided, but we use _.keys to determine discovered edges
  delete this._discoveredEdges[edgeId];
  if (this.edgeEvents.removed) this.edgeEvents.removed(edge);
  for (event in this._edgeListeners[edge.id]) {
    edge.removeListener(event, this._edgeListeners[edge.id][event]);
    this._edgeListeners[edge.id][event] = null;
  }
  this._edgeListeners[edge.id] = null;
};

module.exports = NetworkSubscriber;
