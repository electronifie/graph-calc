var _ = require('lodash');
var Edge = require('./Edge');
var Traverser = require('./Traverser');
var util = require('util');

var PathTraverser = function (options) {
  options = options || {};

  this.path = options.path;
  // We need to keep our own list, as meta.previouslyVisited will always be true for loopbacks
  this.revisitNodes = _.isBoolean(options.revisitNodes) ? options.revisitNodes : true;
  this.onLeafNode = options.onLeafNode || function (node, meta) { };
  this.originalOnVisitNode = options.onVistNode || function (node, meta) { };
  this.originalShouldVisitNode = options.shouldVisitNode || function (node, path) { return true; };

  this.visitedLeaves = {};

  var parentOptions = _.extend({}, options, {
    allowLoops: _.isBoolean(options.allowLoops) ? options.allowLoops : true,
    shouldVisitNode: _.bind(this._shouldVisitNode, this),
    onVisitNode: _.bind(this._onVisitNode, this)
  });

  Traverser.call(this, parentOptions);
};

util.inherits(PathTraverser, Traverser);

PathTraverser.prototype.getLeafNodes = function (rootNode) {
  var oldOnLeafNode = this.onLeafNode;
  var visitedNodes = [];
  this.onLeafNode = function (node) { visitedNodes.push(node); };
  this.traverse(rootNode);
  this.onLeafNode = oldOnLeafNode;
  return visitedNodes;
};

PathTraverser.prototype._pathProgress = function (path) {
  var edgeTypesAlongPath = _.chain(path).map(function (entity) {
    if (entity instanceof Edge) return entity.type;
  }).compact().value();

  var isDifferent = !_.chain(this.path).slice(0, edgeTypesAlongPath.length).isEqual(edgeTypesAlongPath).value();
  if (isDifferent) return -1;

  return edgeTypesAlongPath.length / this.path.length;
};

PathTraverser.prototype._shouldVisitNode = function (node, path) {
  var originalDecision = this.originalShouldVisitNode(node, path);
  var nodeIsOnPath = this._pathProgress(path) >= 0;

  return originalDecision && nodeIsOnPath;
};

PathTraverser.prototype._onVisitNode = function (node, meta) {
  var pathProgress = this._pathProgress(meta.path);
  var isLeaf = pathProgress === 1;

  this.originalOnVisitNode(node, _.extend({}, meta, { pathProgress: pathProgress }));

  if (isLeaf) {
    var previouslyVisited = !!this.visitedLeaves[node.id];

    if ( this.revisitNodes || (!previouslyVisited) ) {
      this.onLeafNode(node, _.extend({}, meta, { previouslyVisited: previouslyVisited }));
    }

    this.visitedLeaves[node.id] = true;
  }
};

module.exports = PathTraverser;
