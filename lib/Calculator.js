var _ = require('lodash');
var Node = require('./Node');
var PathTraverser = require('./PathTraverser');

var Calculator = function (options) {
  this._lodashWrapper = null;
  this._acceptsNodeType = options.acceptsNodeType;

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

Calculator.prototype.calculateWithSaved = function (node) {
  if (! (node instanceof Node)) throw new Error('Object passed to calculator is not a Node');
  if (this._acceptsNodeType && this._acceptsNodeType !== node.type ) throw new Error('Node is of wrong type. Expected ' + this._acceptsNodeType + ' but got ' + node.type);

  var lodashWrapperClone = this._lodashWrapper.tap(_.noop);
  lodashWrapperClone.__wrapped__ = node;

  this._rootNode = node;
  this._savedValues = {};
  var result = lodashWrapperClone.value();
  var savedValues = this._savedValues;
  this._rootNode = null;
  this._savedValues = null;

  return {
    result: result,
    saved: savedValues
  };
};

Calculator.prototype.calculate = function (node) {
  return this.calculateWithSaved(node).result;
};

Calculator.prototype._addLodashMixins = function (lodashInstance) {
  lodashInstance.mixin({
    withNodes: this._withNodes.bind(this),
    saveAs: this._saveAs.bind(this),
    withSaved: this._withSaved.bind(this),
    withAllSaved: this._withAllSaved.bind(this),
    mapCalc: this._mapCalc.bind(this),
    mapAndIndexCalc: this._mapAndIndexCalc.bind(this)
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

Calculator.prototype._mapCalc = function (currentVal, calculator) {
  return _.map(currentVal, function (value) {
    return calculator.calculate(value);
  })
};

Calculator.prototype._mapAndIndexCalc = function (currentVal, calculator) {
  return _.chain(currentVal)
      .indexBy('id')
      .mapValues(function (value) { return calculator.calculate(value); })
      .value();
};

module.exports = Calculator;
