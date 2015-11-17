var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');

describe('Node', function () {

  var SchoolClasses;
  var SchoolGraph;
  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;
  });

  describe('#on', function () {
    it('emits an added-edge event', function () {
      var graph = new SchoolGraph();

      var englishNode = graph.factory.createOrUpdateNode('class', { id: 'English' });

      var addedEdgeStub = sinon.stub();
      var addedEdgeAttendedByStub = sinon.stub();

      englishNode.on('added-edge', addedEdgeStub);
      englishNode.on('added-edge-attendedBy', addedEdgeAttendedByStub);

      graph.factory.createOrUpdateEdge('taughtBy',   { teacher: { id: 'Sue'  }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('teaches',    { teacher: { id: 'Sue'  }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Fred' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Fred' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bill' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bill' }, class: { id: 'Physics' } });

      assert.equal(addedEdgeStub.callCount, 3);
      assert.equal(addedEdgeAttendedByStub.callCount, 2);

      assert.deepEqual(_.map(addedEdgeStub.args, function (call) { return call[0].id }), ['taughtBy-English-Sue', 'attendedBy-English-Fred', 'attendedBy-English-Bill']);
      assert.deepEqual(_.map(addedEdgeAttendedByStub.args, function (call) { return call[0].id }), ['attendedBy-English-Fred', 'attendedBy-English-Bill']);

    });
  });
});
