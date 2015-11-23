var _ = require('lodash');
var assert = require('chai').assert;
var SchoolGraphClasses = require('./_SchoolGraph');

var Serializer = require('..').Serializer;

describe('Serializer', function () {

  var SchoolClasses;
  var SchoolGraph;
  var basicGraph;
  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;

    basicGraph = new SchoolGraph();

    basicGraph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
    basicGraph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
    basicGraph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    basicGraph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    basicGraph.factory.createOrUpdateEdge('attends', { student: { id: 'Max' }, class: { id: 'Chemistry' } });
    basicGraph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Max' }, class: { id: 'Chemistry' } });
    basicGraph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sam' }, class: { id: 'Biology' } });
    basicGraph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sam' }, class: { id: 'Biology' } });
    basicGraph.factory.createOrUpdateEdge('studentRepOf', { student: { id: 'Max' }, department: { id: 'Science' } });
    basicGraph.factory.createOrUpdateEdge('headOf', { teacher: { id: 'Sam' }, department: { id: 'Science' } });
    basicGraph.factory.createOrUpdateEdge('provides', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    basicGraph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    basicGraph.factory.createOrUpdateEdge('provides', { class: { id: 'Biology' }, department: { id: 'Science' } });
    basicGraph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Biology' }, department: { id: 'Science' } });

  });

  describe('#serialize', function () {
    it('generates a full representation of the graph if no options are passed', function () {
      var serializer = new Serializer();

      assert.deepEqual(
          serializer.serialize(basicGraph),
          {
            edges: [
              { id: 'teaches-Sue-Chemistry', name: 'teaches-Sue-Chemistry', type: 'teaches', from: 'teacher-Sue', to: 'class-Chemistry' },
              { id: 'teaches-Sam-Biology', name: 'teaches-Sam-Biology', type: 'teaches', from: 'teacher-Sam', to: 'class-Biology' },
              { id: 'taughtBy-Chemistry-Sue', name: 'taughtBy-Chemistry-Sue', type: 'taughtBy', from: 'class-Chemistry', to: 'teacher-Sue' },
              { id: 'taughtBy-Biology-Sam', name: 'taughtBy-Biology-Sam', type: 'taughtBy', from: 'class-Biology', to: 'teacher-Sam' },
              { id: 'attends-Bobby-Chemistry', name: 'attends-Bobby-Chemistry', type: 'attends', from: 'student-Bobby', to: 'class-Chemistry' },
              { id: 'attends-Max-Chemistry', name: 'attends-Max-Chemistry', type: 'attends', from: 'student-Max', to: 'class-Chemistry' },
              { id: 'attendedBy-Chemistry-Bobby', name: 'attendedBy-Chemistry-Bobby', type: 'attendedBy', from: 'class-Chemistry', to: 'student-Bobby' },
              { id: 'attendedBy-Chemistry-Max', name: 'attendedBy-Chemistry-Max', type: 'attendedBy', from: 'class-Chemistry', to: 'student-Max' },
              { id: 'headOf-Sam-Science', name: 'headOf-Sam-Science', type: 'headOf', from: 'teacher-Sam', to: 'department-Science' },
              { id: 'studentRepOf-Max-Science', name: 'studentRepOf-Max-Science', type: 'studentRepOf', from: 'student-Max', to: 'department-Science' },
              { id: 'providedBy-Chemistry-Science', name: 'providedBy-Chemistry-Science', type: 'providedBy', from: 'class-Chemistry', to: 'department-Science' },
              { id: 'providedBy-Biology-Science', name: 'providedBy-Biology-Science', type: 'providedBy', from: 'class-Biology', to: 'department-Science' },
              { id: 'provides-Science-Chemistry', name: 'provides-Science-Chemistry', type: 'provides', from: 'department-Science', to: 'class-Chemistry' },
              { id: 'provides-Science-Biology', name: 'provides-Science-Biology', type: 'provides', from: 'department-Science', to: 'class-Biology' }
            ],
            nodes: [
              { id: 'department-Science', name: 'department-Science', type: 'department' },
              { id: 'teacher-Sue', name: 'teacher-Sue', type: 'teacher' },
              { id: 'teacher-Sam', name: 'teacher-Sam', type: 'teacher' },
              { id: 'class-Chemistry', name: 'class-Chemistry', type: 'class' },
              { id: 'class-Biology', name: 'class-Biology', type: 'class' },
              { id: 'student-Bobby', name: 'student-Bobby', type: 'student' },
              { id: 'student-Max', name: 'student-Max', type: 'student' }
            ]
          }
      );
    });

    it('includes extra json provided by a node/edge', function () {
      SchoolClasses.TeachesEdge.prototype.extendJson = function () { return { edgeIdLength: this.id.length } };
      SchoolClasses.TeacherNode.prototype.extendJson = function () { return { nodeIdLength: this.id.length } };

      var graph = new SchoolGraph();
      var serializer = new Serializer();
      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });

      assert.deepEqual(
          serializer.serialize(graph),
          {
            edges: [
              { id: 'teaches-Sue-Chemistry', name: 'teaches-Sue-Chemistry', type: 'teaches', from: 'teacher-Sue', to: 'class-Chemistry', edgeIdLength: 21 }
            ],
            nodes: [
              { id: 'teacher-Sue', name: 'teacher-Sue', type: 'teacher', nodeIdLength: 11 },
              { id: 'class-Chemistry', name: 'class-Chemistry', type: 'class' }
            ]
          }
      );

    });

    it('can exclude node and edge types', function () {
      var serializer = new Serializer({
        excludeNodeTypes: ['department'],
        excludeEdgeTypes: ['taughtBy', 'attendedBy']
      });

      // Note, 'headOf', 'studentRepOf', 'providedBy' and 'provides' also excluded because they connect with a 'department' node

      assert.deepEqual(
          serializer.serialize(basicGraph),
          {
            edges: [
              { id: 'teaches-Sue-Chemistry', name: 'teaches-Sue-Chemistry', type: 'teaches', from: 'teacher-Sue', to: 'class-Chemistry' },
              { id: 'teaches-Sam-Biology', name: 'teaches-Sam-Biology', type: 'teaches', from: 'teacher-Sam', to: 'class-Biology' },
              { id: 'attends-Bobby-Chemistry', name: 'attends-Bobby-Chemistry', type: 'attends', from: 'student-Bobby', to: 'class-Chemistry' },
              { id: 'attends-Max-Chemistry', name: 'attends-Max-Chemistry', type: 'attends', from: 'student-Max', to: 'class-Chemistry' }
            ],
            nodes: [
              { id: 'teacher-Sue', name: 'teacher-Sue', type: 'teacher' },
              { id: 'teacher-Sam', name: 'teacher-Sam', type: 'teacher' },
              { id: 'class-Chemistry', name: 'class-Chemistry', type: 'class' },
              { id: 'class-Biology', name: 'class-Biology', type: 'class' },
              { id: 'student-Bobby', name: 'student-Bobby', type: 'student' },
              { id: 'student-Max', name: 'student-Max', type: 'student' }
            ]
          }
      );
    });

    it('can restrict by node and edge types', function () {
      var serializer = new Serializer({
        onlyNodeTypes: ['class', 'teacher', 'department'],
        onlyEdgeTypes: ['taughtBy', 'teaches', 'providedBy', 'attendedBy']
      });

      // Note: 'attendedBy' won't be included because it connects to the excluded node type 'student'

      assert.deepEqual(
          serializer.serialize(basicGraph),
          {
            edges: [
              { id: 'teaches-Sue-Chemistry', name: 'teaches-Sue-Chemistry', type: 'teaches', from: 'teacher-Sue', to: 'class-Chemistry' },
              { id: 'teaches-Sam-Biology', name: 'teaches-Sam-Biology', type: 'teaches', from: 'teacher-Sam', to: 'class-Biology' },
              { id: 'taughtBy-Chemistry-Sue', name: 'taughtBy-Chemistry-Sue', type: 'taughtBy', from: 'class-Chemistry', to: 'teacher-Sue' },
              { id: 'taughtBy-Biology-Sam', name: 'taughtBy-Biology-Sam', type: 'taughtBy', from: 'class-Biology', to: 'teacher-Sam' },
              { id: 'providedBy-Chemistry-Science', name: 'providedBy-Chemistry-Science', type: 'providedBy', from: 'class-Chemistry', to: 'department-Science' },
              { id: 'providedBy-Biology-Science', name: 'providedBy-Biology-Science', type: 'providedBy', from: 'class-Biology', to: 'department-Science' }
            ],
            nodes: [
              { id: 'department-Science', name: 'department-Science', type: 'department' },
              { id: 'teacher-Sue', name: 'teacher-Sue', type: 'teacher' },
              { id: 'teacher-Sam', name: 'teacher-Sam', type: 'teacher' },
              { id: 'class-Chemistry', name: 'class-Chemistry', type: 'class' },
              { id: 'class-Biology', name: 'class-Biology', type: 'class' }
            ]
          }
      );
    });

    it('can determine if a node/edge should be included with passed functions', function () {
      var serializer = new Serializer({
        excludeNodeTypes: ['department'],
        excludeEdgeTypes: ['taughtBy'],
        shouldIncludeNode: function (node) {
          // Excluded nodes don't get passed
          assert.notEqual(node.type, 'department');

          return node.id !== 'teacher-Sam';
        },
        shouldIncludeEdge: function (edge) {
          // Excluded edges don't get passed
          assert.notEqual(edge.type, 'taughtBy');

          return edge.toNode.id !== 'student-Max';
        }
      });

      assert.deepEqual(
          serializer.serialize(basicGraph),
          {
            edges: [
              { id: 'teaches-Sue-Chemistry', name: 'teaches-Sue-Chemistry', type: 'teaches', from: 'teacher-Sue', to: 'class-Chemistry' },
              { id: 'attends-Bobby-Chemistry', name: 'attends-Bobby-Chemistry', type: 'attends', from: 'student-Bobby', to: 'class-Chemistry' },
              { id: 'attends-Max-Chemistry', name: 'attends-Max-Chemistry', type: 'attends', from: 'student-Max', to: 'class-Chemistry' },
              { id: 'attendedBy-Chemistry-Bobby', name: 'attendedBy-Chemistry-Bobby', type: 'attendedBy', from: 'class-Chemistry', to: 'student-Bobby' }
            ],
            nodes: [
              { id: 'teacher-Sue', name: 'teacher-Sue', type: 'teacher' },
              { id: 'class-Chemistry', name: 'class-Chemistry', type: 'class' },
              { id: 'class-Biology', name: 'class-Biology', type: 'class' },
              { id: 'student-Bobby', name: 'student-Bobby', type: 'student' },
              { id: 'student-Max', name: 'student-Max', type: 'student' }
            ]
          }
      );
    });

  });
});
