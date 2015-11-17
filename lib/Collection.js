var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var extractId = function (classType, raw) {
  var id = raw.id || raw._id;
  if (!id) {
    throw new Error(
      'Can\'t create unique id for "' + classType + '" as the raw model passed doesn\'t contain an "id" field. ' +
      'Add a static "raw2id" method to your "' + classType + '" Class to generate a custom ID.'
    );
  }
  return this.classType + '-' + id;
};

var Collection = function (options) {
  this._factory = options.factory || this._requiredFieldError('factory');
  this._instanceIndex = {};

  this._Class = options.Class || this._requiredFieldError('Class');
  this.classType = options.Class.type || options.Class.prototype.type || this._requiredFieldError('Class.prototype.type');
  this._idExtractor = options.Class.raw2id || extractId.bind(this, this.classType);
};

util.inherits(Collection, EventEmitter);

Collection.prototype.get = function (id) {
  return this._instanceIndex[id];
};

Collection.prototype.createOrUpdate = function (raw) {
  var id = this._idExtractor(raw);
  var item = this.get(id);
  if (!item) {
    item = new this._Class({ raw: raw, factory: this._factory });
    this._instanceIndex[id] = item;
    this.emit('created', item);
  } else {
    item.update(raw);
  }
  return item;
};

Collection.prototype.getAll = function () { return _.values(this._instanceIndex); };

Collection.prototype._requiredFieldError = function (fieldName) { throw new Error('Missing required field: ' + fieldName); };

module.exports = Collection;
