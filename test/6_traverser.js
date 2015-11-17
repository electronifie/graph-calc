var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');
var Traverser = require('..').Traverser;

describe('Traverser', function () {

  var SchoolClasses;
  var SchoolGraph;

  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;
  });

  var createGraph = function () {
    var graph = new SchoolGraph();
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Max' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Max' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sam' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sam' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('studentRepOf', { student: { id: 'Max' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('headOf', { teacher: { id: 'Sam' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Biology' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Biology' }, department: { id: 'Science' } });
    return graph;
  };

  var assertTraversal = function (expectedNodeIds, expectedEdgeIds, traversalResultJson) {
    var traversedNodeIds = _.pluck(traversalResultJson.nodes, 'id');
    var traversedEdgeIds = _.pluck(traversalResultJson.edges, 'id');
    assert.deepEqual(traversedNodeIds, expectedNodeIds);
    assert.deepEqual(traversedEdgeIds, expectedEdgeIds);
  };

  describe('#traverse', function () {
    it('returns a json ready breadth-first traversal from a node', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser();
      var json = traverser.traverse(startNode).json;

      assert.deepEqual(json, {
        nodes: [
          { id: 'teacher-Sue', name: 'teacher-Sue', type: 'teacher' },
          { id: 'class-Chemistry', name: 'class-Chemistry', type: 'class' },
          { id: 'student-Bobby', name: 'student-Bobby', type: 'student' },
          { id: 'student-Max', name: 'student-Max', type: 'student' },
          { id: 'department-Science', name: 'department-Science', type: 'department' },
          { id: 'class-Biology', name: 'class-Biology', type: 'class' },
          { id: 'teacher-Sam', name: 'teacher-Sam', type: 'teacher' }
        ],
        edges: [
          { id: 'teaches-Sue-Chemistry', name: 'teaches-Sue-Chemistry', type: 'teaches', from: 'teacher-Sue', to: 'class-Chemistry' },
          { id: 'taughtBy-Chemistry-Sue', name: 'taughtBy-Chemistry-Sue', type: 'taughtBy', from: 'class-Chemistry', to: 'teacher-Sue' },
          { id: 'attendedBy-Chemistry-Bobby', name: 'attendedBy-Chemistry-Bobby', type: 'attendedBy', from: 'class-Chemistry', to: 'student-Bobby' },
          { id: 'attendedBy-Chemistry-Max', name: 'attendedBy-Chemistry-Max', type: 'attendedBy', from: 'class-Chemistry', to: 'student-Max' },
          { id: 'providedBy-Chemistry-Science', name: 'providedBy-Chemistry-Science', type: 'providedBy', from: 'class-Chemistry', to: 'department-Science' },
          { id: 'attends-Bobby-Chemistry', name: 'attends-Bobby-Chemistry', type: 'attends', from: 'student-Bobby', to: 'class-Chemistry' },
          { id: 'attends-Max-Chemistry', name: 'attends-Max-Chemistry', type: 'attends', from: 'student-Max', to: 'class-Chemistry' },
          { id: 'studentRepOf-Max-Science', name: 'studentRepOf-Max-Science', type: 'studentRepOf', from: 'student-Max', to: 'department-Science' },
          { id: 'provides-Science-Chemistry', name: 'provides-Science-Chemistry', type: 'provides', from: 'department-Science', to: 'class-Chemistry' },
          { id: 'provides-Science-Biology', name: 'provides-Science-Biology', type: 'provides', from: 'department-Science', to: 'class-Biology' },
          { id: 'taughtBy-Biology-Sam', name: 'taughtBy-Biology-Sam', type: 'taughtBy', from: 'class-Biology', to: 'teacher-Sam' },
          { id: 'providedBy-Biology-Science', name: 'providedBy-Biology-Science', type: 'providedBy', from: 'class-Biology', to: 'department-Science' },
          { id: 'teaches-Sam-Biology', name: 'teaches-Sam-Biology', type: 'teaches', from: 'teacher-Sam', to: 'class-Biology' },
          { id: 'headOf-Sam-Science', name: 'headOf-Sam-Science', type: 'headOf', from: 'teacher-Sam', to: 'department-Science' }
        ]
      });
    });

    it('calls onVisitNode and onTraverseEdge when visiting nodes and edges', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');

      var firstVisitNodeIds = [];
      var allVisitNodeIds = [];
      var traversedEdgeIds = [];
      var traverser = new Traverser({
        onVisitNode: function (node, meta) {
          if (!meta.previouslyVisited) firstVisitNodeIds.push(node.id);
          allVisitNodeIds.push(node.id);
        },
        onTraverseEdge: function (edge) { traversedEdgeIds.push(edge.id); }
      });
      traverser.traverse(startNode);

      assert.deepEqual(
        ['teacher-Sue', 'class-Chemistry', 'student-Bobby', 'student-Max', 'department-Science', 'class-Biology', 'teacher-Sam'],
        firstVisitNodeIds
      );
      assert.deepEqual(
        ['teacher-Sue', 'class-Chemistry', 'teacher-Sue', 'student-Bobby', 'student-Max', 'department-Science', 'class-Chemistry', 'class-Chemistry', 'department-Science', 'class-Chemistry', 'class-Biology', 'teacher-Sam', 'department-Science', 'class-Biology', 'department-Science'],
        allVisitNodeIds
      );
      assert.deepEqual(
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'attendedBy-Chemistry-Bobby', 'attendedBy-Chemistry-Max', 'providedBy-Chemistry-Science', 'attends-Bobby-Chemistry', 'attends-Max-Chemistry', 'studentRepOf-Max-Science', 'provides-Science-Chemistry', 'provides-Science-Biology', 'taughtBy-Biology-Sam', 'providedBy-Biology-Science', 'teaches-Sam-Biology', 'headOf-Sam-Science'],
        traversedEdgeIds
      );
    });

    it('can provide the depth, passed edge and path to onVisitNode calls', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');

      var paths = [];
      var onVisitNodeStub = sinon.spy(function (node, meta) { paths.push(_.pluck(meta.path, 'id')); });
      var traverser = new Traverser({ onVisitNode: onVisitNodeStub });
      traverser.traverse(startNode);

      assert.deepEqual(onVisitNodeStub.getCall(0).args[0].id, 'teacher-Sue');
      assert.deepEqual(onVisitNodeStub.getCall(0).args[1], { previouslyVisited: false, depth: 0, viaEdge: undefined, path: [] });

      assert.deepEqual(onVisitNodeStub.getCall(1).args[0].id, 'class-Chemistry');
      assert.deepEqual(onVisitNodeStub.getCall(1).args[1].previouslyVisited, false);
      assert.deepEqual(onVisitNodeStub.getCall(1).args[1].depth, 1);
      assert.deepEqual(onVisitNodeStub.getCall(1).args[1].viaEdge.id, 'teaches-Sue-Chemistry');

      assert.deepEqual(onVisitNodeStub.getCall(6).args[0].id, 'class-Chemistry');
      assert.deepEqual(onVisitNodeStub.getCall(6).args[1].previouslyVisited, true);
      assert.deepEqual(onVisitNodeStub.getCall(6).args[1].depth, 3);
      assert.deepEqual(onVisitNodeStub.getCall(6).args[1].viaEdge.id, 'attends-Bobby-Chemistry');

      assert.deepEqual(paths[0],  []);
      assert.deepEqual(paths[1],  ['teacher-Sue', 'teaches-Sue-Chemistry']);
      assert.deepEqual(paths[2],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'taughtBy-Chemistry-Sue']);
      assert.deepEqual(paths[3],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'attendedBy-Chemistry-Bobby']);
      assert.deepEqual(paths[4],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'attendedBy-Chemistry-Max']);
      assert.deepEqual(paths[5],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'providedBy-Chemistry-Science']);
      assert.deepEqual(paths[6],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'attendedBy-Chemistry-Bobby', 'student-Bobby', 'attends-Bobby-Chemistry']);
      assert.deepEqual(paths[7],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'attendedBy-Chemistry-Max', 'student-Max', 'attends-Max-Chemistry']);
      assert.deepEqual(paths[8],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'attendedBy-Chemistry-Max', 'student-Max', 'studentRepOf-Max-Science']);
      assert.deepEqual(paths[9],  ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'providedBy-Chemistry-Science', 'department-Science', 'provides-Science-Chemistry']);
      assert.deepEqual(paths[10], ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'providedBy-Chemistry-Science', 'department-Science', 'provides-Science-Biology']);
      assert.deepEqual(paths[11], ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'providedBy-Chemistry-Science', 'department-Science', 'provides-Science-Biology', 'class-Biology', 'taughtBy-Biology-Sam']);
      assert.deepEqual(paths[12], ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'providedBy-Chemistry-Science', 'department-Science', 'provides-Science-Biology', 'class-Biology', 'providedBy-Biology-Science']);
      assert.deepEqual(paths[13], ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'providedBy-Chemistry-Science', 'department-Science', 'provides-Science-Biology', 'class-Biology', 'taughtBy-Biology-Sam', 'teacher-Sam', 'teaches-Sam-Biology']);
      assert.deepEqual(paths[14], ['teacher-Sue', 'teaches-Sue-Chemistry', 'class-Chemistry', 'providedBy-Chemistry-Science', 'department-Science', 'provides-Science-Biology', 'class-Biology', 'taughtBy-Biology-Sam', 'teacher-Sam', 'headOf-Sam-Science']);
    });

    it('can set a max depth to traverse', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser({ maxDepth: 3 });
      var results = traverser.traverse(startNode).json;

      assertTraversal(
        ['teacher-Sue', 'class-Chemistry', 'student-Bobby', 'student-Max', 'department-Science'],
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'attendedBy-Chemistry-Bobby','attendedBy-Chemistry-Max', 'providedBy-Chemistry-Science'],
        results
      );
    });

    it('can exclude edge types from traversal', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser({
        excludeEdgeTypes: ['provides', 'attends']
      });
      var results = traverser.traverse(startNode).json;

      assertTraversal(
        ['teacher-Sue', 'class-Chemistry', 'student-Bobby', 'student-Max', 'department-Science'],
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'attendedBy-Chemistry-Bobby', 'attendedBy-Chemistry-Max', 'providedBy-Chemistry-Science', 'studentRepOf-Max-Science'],
        results
      );
    });

    it('can exclude node types from traversal', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser({
        excludeNodeTypes: ['student']
      });
      var results = traverser.traverse(startNode).json;

      assertTraversal(
        ['teacher-Sue', 'class-Chemistry', 'department-Science', 'class-Biology', 'teacher-Sam'],
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'providedBy-Chemistry-Science', 'provides-Science-Chemistry', 'provides-Science-Biology', 'taughtBy-Biology-Sam', 'providedBy-Biology-Science', 'teaches-Sam-Biology', 'headOf-Sam-Science'],
        results
      );
    });

    it('can provide a function that decides if a node should be visited', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser({
        shouldVisitNode: function (node) { return node.id !== 'student-Max'; }
      });
      var results = traverser.traverse(startNode).json;

      assertTraversal(
        ['teacher-Sue', 'class-Chemistry', 'student-Bobby', 'department-Science', 'class-Biology', 'teacher-Sam'],
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'attendedBy-Chemistry-Bobby', 'providedBy-Chemistry-Science', 'attends-Bobby-Chemistry', 'provides-Science-Chemistry', 'provides-Science-Biology', 'taughtBy-Biology-Sam', 'providedBy-Biology-Science', 'teaches-Sam-Biology', 'headOf-Sam-Science'],
        results
      );
    });

    it('can provide a function that decides if an edge should be traversed', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser({
        shouldTraverseEdge: function (edge) { return edge.type !== 'attendedBy'; }
      });
      var results = traverser.traverse(startNode).json;

      assertTraversal(
        ['teacher-Sue', 'class-Chemistry', 'department-Science', 'class-Biology', 'teacher-Sam'],
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'providedBy-Chemistry-Science', 'provides-Science-Chemistry', 'provides-Science-Biology', 'taughtBy-Biology-Sam', 'providedBy-Biology-Science', 'teaches-Sam-Biology', 'headOf-Sam-Science'],
        results
      );
    });

    it('can provide a list of node types to visit', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser({
        onlyNodeTypes: ['class', 'department', 'teacher']
      });
      var results = traverser.traverse(startNode).json;

      assertTraversal(
        ['teacher-Sue', 'class-Chemistry', 'department-Science', 'class-Biology', 'teacher-Sam'],
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'providedBy-Chemistry-Science', 'provides-Science-Chemistry', 'provides-Science-Biology', 'taughtBy-Biology-Sam', 'providedBy-Biology-Science', 'teaches-Sam-Biology', 'headOf-Sam-Science'],
        results
      );
    });

    it('can provide a list of edge types to traverse', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var traverser = new Traverser({
        onlyEdgeTypes: ['teaches', 'taughtBy', 'attendedBy']
      });
      var results = traverser.traverse(startNode).json;

      assertTraversal(
        ['teacher-Sue', 'class-Chemistry', 'student-Bobby', 'student-Max'],
        ['teaches-Sue-Chemistry', 'taughtBy-Chemistry-Sue', 'attendedBy-Chemistry-Bobby', 'attendedBy-Chemistry-Max'],
        results
      );
    });
  });

});
