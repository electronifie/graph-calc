var _ = require('lodash');
var PathTraverser = require('./PathTraverser');

var Calculator = function (options) {
  this._lodashWrapper = null;

  this._rootNode = null;
  this._savedValues = null;
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
  this._savedValues = {};
  var result = lodashWrapperClone.value();
  this._rootNode = null;
  this._savedValues = null;

  return result;
};

Calculator.prototype._addLodashMixins = function (lodashInstance) {
  lodashInstance.mixin({
    withNodes: this._withNodes.bind(this),
    saveAs: this._saveAs.bind(this),
    withSaved: this._withSaved.bind(this),
    withAllSaved: this._withAllSaved.bind(this)
  });
};

/* Lodash Mixins */

Calculator.prototype._withNodes = function (currentVal, pathTraverserOptions) {
  var traverser = new PathTraverser(pathTraverserOptions);
  return traverser.getLeafNodes(this._rootNode);
};

Calculator.prototype._saveAs = function (currentVal, name) {
  this._savedValues[name] = currentVal;
  return currentVal;
};

Calculator.prototype._withSaved = function (currentVal, name) {
  if (! (name in this._savedValues)) throw new Error('Saved value "' + name + '" does not exist.');
  return this._savedValues[name];
};

Calculator.prototype._withAllSaved = function (currentVal) {
  return _.clone(this._savedValues);
};

module.exports = Calculator;
