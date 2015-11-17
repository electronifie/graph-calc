var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');

describe('Graph', function () {

  var SchoolClasses;
  var SchoolGraph;
  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;
  });

  describe('#factory.createOrUpdateEdge', function () {

    it('creates edges and nodes, ignoring duplicates', function () {
      var graph = new SchoolGraph();

      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Physics' } });

      assert.deepEqual(
        graph.getFullGraph(),
        {
          "edges": [
            {
              "id": "teaches-Sue-Chemistry",
              "name": "teaches-Sue-Chemistry",
              "from": "teacher-Sue", "type": "teaches", "to": "class-Chemistry"
            },
            {
              "id": "teaches-Sue-Physics",
              "name": "teaches-Sue-Physics",
              "from": "teacher-Sue", "type": "teaches", "to": "class-Physics"
            }
          ],
          "nodes": [
            { "id": "teacher-Sue", "name": "teacher-Sue", "type": "teacher" },
            { "id": "class-Chemistry", "name": "class-Chemistry", "type": "class" },
            { "id": "class-Physics", "name": "class-Physics", "type": "class" }
          ]
        }
      );
    });

    it('calls update(raw) on subsequent calls', function () {
      var updateStub = sinon.stub();
      SchoolClasses.TeachesEdge.prototype.update = updateStub;
      var graph = new SchoolGraph();

      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Bob', age: 30 }, class: { id: 'Physics' } });
      assert.equal(updateStub.callCount, 0);

      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Bob', age: 31 }, class: { id: 'Physics' } });
      assert.equal(updateStub.callCount, 1);
      assert.deepEqual(updateStub.firstCall.args[0], { teacher: { id: 'Bob', age: 31 }, class: { id: 'Physics' } });
    });

  });

  describe('#factory.createOrUpdateNode', function () {

    it('creates nodes, ignoring duplicates', function () {
      var graph = new SchoolGraph();

      graph.factory.createOrUpdateNode('teacher', { id: 'Bob' });
      graph.factory.createOrUpdateNode('teacher', { id: 'Bob' });
      graph.factory.createOrUpdateNode('teacher', { id: 'Mary' });

      assert.deepEqual(
        graph.getFullGraph(),
        {
          "edges": [],
          "nodes": [
            { "id": "teacher-Bob", "name": "teacher-Bob", "type": "teacher" },
            { "id": "teacher-Mary", "name": "teacher-Mary", "type": "teacher" }
          ]
        }
      );
    });

  });

  describe('#getFullGraph', function () {

    it('constructs elaborate graphs', function () {
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

      assert.deepEqual(
        graph.getFullGraph(),
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
      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });

      assert.deepEqual(
        graph.getFullGraph(),
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

  });

  describe('#factory.on', function () {
    it('emits events when an edge or node is created', function () {
      var createdNodeStub = sinon.stub();
      var createdTeacherNodeStub = sinon.stub();
      var createdEdgeStub = sinon.stub();
      var createdTeachesEdgeStub = sinon.stub();

      var graph = new SchoolGraph();
      graph.factory.on('created-node', createdNodeStub);
      graph.factory.on('created-node-teacher', createdTeacherNodeStub);
      graph.factory.on('created-edge', createdEdgeStub);
      graph.factory.on('created-edge-teaches', createdTeachesEdgeStub);

      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } }); // duplicate
      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'English' } });
      graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Bob' }, class: { id: 'Physics' } });
      graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bill' }, class: { id: 'Physics' } });

      assert.equal(createdNodeStub.callCount, 6);
      assert.equal(createdTeacherNodeStub.callCount, 2);
      assert.equal(createdEdgeStub.callCount, 4);
      assert.equal(createdTeachesEdgeStub.callCount, 3);

      assert.deepEqual(_.map(createdNodeStub.args, function (call) { return call[0].id }), ['teacher-Sue', 'class-Chemistry', 'class-English', 'teacher-Bob', 'class-Physics', 'student-Bill']);
      assert.deepEqual(_.map(createdTeacherNodeStub.args, function (call) { return call[0].id }), ['teacher-Sue', 'teacher-Bob']);
      assert.deepEqual(_.map(createdEdgeStub.args, function (call) { return call[0].id }), ['teaches-Sue-Chemistry', 'teaches-Sue-English', 'teaches-Bob-Physics', 'attends-Bill-Physics']);
      assert.deepEqual(_.map(createdTeachesEdgeStub.args, function (call) { return call[0].id }), ['teaches-Sue-Chemistry', 'teaches-Sue-English', 'teaches-Bob-Physics']);
    });
  });
});
