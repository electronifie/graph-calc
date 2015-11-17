var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');

describe('Edge', function () {

  var SchoolClasses;
  var SchoolGraph;
  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;
  });

  describe('#delete', function () {
    it('removes an edge from the graph and its attached nodes', function () {
      var graph = new SchoolGraph();

      var englishNode = graph.factory.createOrUpdateNode('class', { id: 'English' });
      graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Fred' }, class: { id: 'English' } });
      assert.equal(englishNode.edges.length, 2);

      graph.factory.getEdge('attendedBy', 'attendedBy-English-Fred').delete();

      assert.equal(englishNode.edges.length, 1);
      assert.equal(englishNode.edges[0].type, 'taughtBy');

      assert.equal(graph.factory.getEdge('attendedBy', 'attendedBy-English-Fred'), undefined);
    });

    it('emits a "deleted" event', function () {
      var graph = new SchoolGraph();
      var edge = graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'English' } });
      var onDeletedStub = sinon.stub();
      edge.on('deleted', onDeletedStub);
      edge.delete();
      assert.equal(onDeletedStub.callCount, 1);
      assert.equal(onDeletedStub.firstCall.args[0].id, 'taughtBy-English-Sue');
    });
  });
});
