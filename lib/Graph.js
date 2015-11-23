var Serializer = require('./Serializer');

var Graph = function (options) {
  this.factory = options.factory || (function () { throw new Error('options.factory not provided'); })();
};

Graph.prototype.toJson = function () { return new Serializer().serialize(this); };

module.exports = Graph;
