var _ = require('lodash');
var PathTraverser = require('./PathTraverser');

var Calculator = function (options) {
  this._lodashWrapper = null;

  this._rootNode = null;
};

Calculator.prototype.start = function () {
  var lodashInstance = _.runInContext();
  this._addLodashMixins(lodashInstance);
  var lodashWrapper = lodashInstance.chain();
  var calculatorInstance = this;

  // A bit of magic. Attach the .finish() method to the LodashWrapper's
  // prototype (needed to cascade between all the clones chaining creates)
  // so that it returns the Calculator object and records the final
  // lodash calculator to perform the calculation.
  lodashWrapper.__proto__.finish = function () {
    calculatorInstance._lodashWrapper = this;
    return calculatorInstance;
  };
  return lodashWrapper;
};

Calculator.prototype.calculate = function (node) {
  var lodashWrapperClone = this._lodashWrapper.tap(_.noop);
  lodashWrapperClone.__wrapped__ = node;

  this._rootNode = node;
  var result = lodashWrapperClone.value();
  this._rootNode = null;

  return result;
};

Calculator.prototype._addLodashMixins = function (lodashInstance) {
  lodashInstance.mixin({
    withNodes: this._withNodes.bind(this)
  });
};

/* Lodash Mixins */

Calculator.prototype._withNodes = function (prev, pathTraverserOptions) {
  var traverser = new PathTraverser(pathTraverserOptions);
  return traverser.getLeafNodes(this._rootNode);
};

module.exports = Calculator;
