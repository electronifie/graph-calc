var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');
var NetworkSubscriber = require('..').NetworkSubscriber;

describe('NetworkSubscriber', function () {

  var SchoolClasses;
  var SchoolGraph;

  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;
  });

  it('listens for the subscribed event(s) within the described network', function () {
    var fooNodeStub = sinon.stub();
    var fooEdgeStub = sinon.stub();
    var discoveredNodeStub = sinon.stub();
    var discoveredEdgeStub = sinon.stub();

    var graph = new SchoolGraph();
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });

    // Not captured
    graph.factory.getNode('student', 'student-Bobby').emit('foo', 'call-1');
    graph.factory.getEdge('attends', 'attends-Bobby-Chemistry').emit('foo', 'call-2');

    var networkSubscriber = new NetworkSubscriber({
      // The base node for the network
      node: graph.factory.getNode('teacher', 'teacher-Sue'),

      // Describe the network
      maxDepth: 5,
      excludeNodeTypes: ['department'],
      excludeEdgeTypes: ['taughtBy'],

      // Attach listeners
      nodeEvents: {
        foo: fooNodeStub,
        discovered: discoveredNodeStub
      },
      edgeEvents: {
        foo: fooEdgeStub,
        discovered: discoveredEdgeStub
      }
    });

    // Existing network

    assert.ok(fooNodeStub.notCalled);
    assert.ok(fooEdgeStub.notCalled);
    assert.equal(discoveredNodeStub.callCount, 2);
    assert.equal(discoveredEdgeStub.callCount, 3);
    assert.equal(discoveredNodeStub.lastCall.args[0].id, 'student-Bobby');
    assert.equal(discoveredEdgeStub.lastCall.args[0].id, 'attends-Bobby-Chemistry');

    // Additions to network

    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'Physics' } });
    assert.equal(discoveredNodeStub.callCount, 3);
    assert.equal(discoveredEdgeStub.callCount, 4);
    assert.equal(discoveredNodeStub.lastCall.args[0].id, 'class-Physics');
    assert.equal(discoveredEdgeStub.lastCall.args[0].id, 'attends-Bobby-Physics');

    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Pam' }, class: { id: 'Physics' } });
    assert.equal(discoveredNodeStub.callCount, 4);
    assert.equal(discoveredEdgeStub.callCount, 5);

    // Omitted from network

    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sam' }, class: { id: 'Physics' } }); // Not connected node
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sam' }, class: { id: 'Physics' } }); // ExcludeEdgeType
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Pam' }, class: { id: 'English' } }); // Outside maxDepth
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Chemistry' }, department: { id: 'Science' } }); // ExcludeNodeType
    assert.equal(discoveredNodeStub.callCount, 4);
    assert.equal(discoveredEdgeStub.callCount, 5);


    // Event in network

    assert.ok(fooNodeStub.notCalled);
    assert.ok(fooEdgeStub.notCalled);

    graph.factory.getNode('student', 'student-Pam').emit('foo', 'call-3');

    assert.ok(fooEdgeStub.notCalled);
    assert.ok(fooNodeStub.calledOnce);
    assert.equal(fooNodeStub.firstCall.args[0].id, 'student-Pam');
    assert.equal(fooNodeStub.firstCall.args[1], 'call-3');

    graph.factory.getEdge('attends', 'attends-Bobby-Chemistry').emit('foo', 'call-4');
    assert.ok(fooNodeStub.calledOnce);
    assert.ok(fooEdgeStub.calledOnce);
    assert.equal(fooEdgeStub.firstCall.args[0].id, 'attends-Bobby-Chemistry');
    assert.equal(fooEdgeStub.firstCall.args[1], 'call-4');

    // Removed connecting node

    // Edge case: node shouldn't be removed from network if multiple valid paths exist and only one is deleted
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Chris' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Chris' }, class: { id: 'Chemistry' } });
    graph.factory.getNode('class', 'class-Physics').delete();
    graph.factory.getNode('student', 'student-Pam').emit('foo', 'call-5');
    assert.ok(fooNodeStub.calledOnce);
    graph.factory.getNode('student', 'student-Chris').emit('foo', 'call-6');
    assert.equal(fooNodeStub.callCount, 2);
    assert.equal(fooNodeStub.secondCall.args[1], 'call-6');

  });

});
