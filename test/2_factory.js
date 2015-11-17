var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');

describe('Factory', function () {

  var SchoolClasses;
  var SchoolGraph;
  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;
  });

  describe('#createOrUpdateEdge', function () {

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

  describe('#createOrUpdateNode', function () {

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

  describe('#on', function () {
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
