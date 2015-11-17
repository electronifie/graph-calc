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

  describe('#delete', function () {
    it('removes an node from the graph and its attached edges', function () {
      var graph = new SchoolGraph();

      var node = graph.factory.createOrUpdateNode('class', { id: 'English' });

      graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Fred' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bob' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bob' }, class: { id: 'Science' } });

      assert.deepEqual(_.pluck(graph.getFullGraph().nodes, 'id'), [ 'teacher-Sue', 'class-English', 'class-Science', 'student-Fred', 'student-Bob' ]);
      assert.deepEqual(_.pluck(graph.getFullGraph().edges, 'id'), [ 'taughtBy-English-Sue', 'attends-Bob-English', 'attends-Bob-Science', 'attendedBy-English-Fred' ]);
      assert.ok(graph.factory.getNode('class', 'class-English'));
      assert.ok(graph.factory.getEdge('taughtBy', 'taughtBy-English-Sue'));

      node.delete();

      assert.deepEqual(_.pluck(graph.getFullGraph().nodes, 'id'), [ 'teacher-Sue', 'class-Science', 'student-Fred', 'student-Bob' ]);
      assert.deepEqual(_.pluck(graph.getFullGraph().edges, 'id'), [ 'attends-Bob-Science' ]);
      assert.notOk(graph.factory.getNode('class', 'class-English'));
      assert.notOk(graph.factory.getEdge('taughtBy', 'taughtBy-English-Sue'));
    });

    it('emits a "deleted" event', function () {
      var graph = new SchoolGraph();
      var node = graph.factory.createOrUpdateNode('class', { id: 'English' });
      graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'English' } });
      var onDeletedStub = sinon.stub();
      node.on('deleted', onDeletedStub);
      node.delete();
      assert.equal(onDeletedStub.callCount, 1);
      assert.equal(onDeletedStub.firstCall.args[0].id, 'class-English');
    });
  });
});
