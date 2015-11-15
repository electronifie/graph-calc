var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');
var PathTraverser = require('..').PathTraverser;

describe('PathTraverser', function () {

  var SchoolClasses;
  var SchoolGraph;

  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;
  });

  var createGraph = function () {
    var graph = new SchoolGraph();
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Bill' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Bill' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Bill' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Bill' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'English' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'English' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'Biology' } });

    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'English' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'English' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Emily' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Emily' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Emily' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Emily' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Emily' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Emily' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Max' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Max' }, class: { id: 'Chemistry' } });

    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Physics' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Physics' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Biology' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Biology' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'English' }, department: { id: 'Arts' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'English' }, department: { id: 'Arts' } });

    graph.factory.createOrUpdateEdge('headOf',  { teacher: { id: 'Sue' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('headOf',  { teacher: { id: 'Bill' }, department: { id: 'Arts' } });
    return graph;
  };

  describe('#traverse', function () {

    it('traverses a path calling onLeafNode(node, meta) when the end of the path is reached', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');

      // All classes attended by students of a teacher
      // Sue teaches:
      //  - Bobby, who attends Chemistry and English
      //  - Emily, who attends Chemistry, Physics and Biology
      var classes = [];
      var traverser = new PathTraverser({
        path: ['teaches', 'attendedBy', 'attends'],
        onLeafNode: function (node, meta) {
          assert(meta.depth, 3); // All nodes should be path.length deep
          classes.push(node.id);
        }
      });
      traverser.traverse(startNode);

      assert.deepEqual(classes, ['class-Chemistry', 'class-English', 'class-Chemistry', 'class-Physics', 'class-Biology'])
    });

    it('can ignore revisits to a node in a traversal', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');

      var classes = [];
      var traverser = new PathTraverser({
        path: ['teaches', 'attendedBy', 'attends'],
        revisitNodes: false,
        onLeafNode: function (node, meta) { classes.push(node.id); }
      });
      traverser.traverse(startNode);

      assert.deepEqual(classes, ['class-Chemistry', 'class-English', 'class-Physics', 'class-Biology'])
    });

    it('can loop back, passing through already visited nodes', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');

      // All teachers that teach students taught by a teacher
      // Sue teaches:
      //  - Bobby, who attends Chemistry (Bill) and English (Sue)
      //  - Emily, who attends Chemistry (Bill), Physics (Bill) and Biology (Sue)
      var classes = [];
      var paths = [];
      var traverser = new PathTraverser({
        path: ['teaches', 'attendedBy', 'attends', 'taughtBy'],
        onLeafNode: function (node, meta) {
          paths.push(_.pluck(meta.path, 'id'));
          classes.push(node.id);
        }
      });
      traverser.traverse(startNode);

      assert.deepEqual(classes, ['teacher-Bill', 'teacher-Sue', 'teacher-Bill', 'teacher-Bill', 'teacher-Sue']);
      // The path below loops back through English to land on Sue
      assert.deepEqual(paths[1], ['teacher-Sue', 'teaches-Sue-English', 'class-English', 'attendedBy-English-Bobby', 'student-Bobby', 'attends-Bobby-English', 'class-English', 'taughtBy-English-Sue']);
    });

  });

  describe('#getLeafNodes', function () {
    it('traverses a path and returns leaf nodes visited', function () {
      var graph = createGraph();
      var startNode = graph.factory.getNode('teacher', 'teacher-Sue');

      // All classes attended by students of a teacher
      // Sue teaches:
      //  - Bobby, who attends Chemistry and English
      //  - Emily, who attends Chemistry, Physics and Biology
      var traverser = new PathTraverser({ path: ['teaches', 'attendedBy', 'attends'] });
      var leafNodes = traverser.getLeafNodes(startNode);
      var leafNodeIds = _.pluck(leafNodes, 'id');

      assert.deepEqual(leafNodeIds, ['class-Chemistry', 'class-English', 'class-Chemistry', 'class-Physics', 'class-Biology'])
    });
  });

});
