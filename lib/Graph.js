var Serializer = require('./Serializer');

/**
 * @constructor
 *
 * @param options {{
 *   factory: Factory
 * }}
 */
var Graph = function (options) {
  this.factory = options.factory || (function () { throw new Error('options.factory not provided'); })();
};

/**
 * @returns {GraphJson}
 */
Graph.prototype.toJson = function () { return new Serializer().serialize(this); };

module.exports = Graph;
