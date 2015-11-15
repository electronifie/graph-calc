var _ = require('lodash');
var util = require('util');

var Edge = require('..').Edge;
var Factory = require('..').Factory;
var Graph = require('..').Graph;
var Node = require('..').Node;

module.exports = function () {

  /** NODES **/

  var DepartmentNode = function (options) {
    this.id = this.type + '-' + options.raw.id;
    Node.call(this, options);
  };
  util.inherits(DepartmentNode, Node);
  DepartmentNode.prototype.type = 'department';

  var TeacherNode = function (options) {
    this.id = this.type + '-' + options.raw.id;
    Node.call(this, options);
  };
  util.inherits(TeacherNode, Node);
  TeacherNode.prototype.type = 'teacher';

  var ClassNode = function (options) {
    this.id = this.type + '-' + options.raw.id;
    Node.call(this, options);
  };
  util.inherits(ClassNode, Node);
  ClassNode.prototype.type = 'class';

  var StudentNode = function (options) {
    this.id = this.type + '-' + options.raw.id;
    Node.call(this, options);
  };
  util.inherits(StudentNode, Node);
  StudentNode.prototype.type = 'student';

  /** EDGES **/

  var TeachesEdge = function (options) {
    this.id = this.type + '-' + options.raw.teacher.id + '-' + options.raw.class.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.teacher);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.class);
    Edge.call(this, options);
  };
  util.inherits(TeachesEdge, Edge);
  TeachesEdge.prototype.fromNodeType = 'teacher';
  TeachesEdge.prototype.type = 'teaches';
  TeachesEdge.prototype.toNodeType = 'class';
  TeachesEdge.raw2id = function (raw) { return TeachesEdge.prototype.type + '-' + raw.teacher.id + '-' + raw.class.id };

  var TaughtByEdge = function (options) {
    this.id = this.type + '-' + options.raw.class.id + '-' + options.raw.teacher.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.class);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.teacher);
    Edge.call(this, options);
  };
  util.inherits(TaughtByEdge, Edge);
  TaughtByEdge.prototype.fromNodeType = 'class';
  TaughtByEdge.prototype.type = 'taughtBy';
  TaughtByEdge.prototype.toNodeType = 'teacher';
  TaughtByEdge.raw2id = function (raw) { return TaughtByEdge.prototype.type + '-' + raw.class.id + '-' + raw.teacher.id };

  var AttendsEdge = function (options) {
    this.id = this.type + '-' + options.raw.student.id + '-' + options.raw.class.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.student);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.class);
    Edge.call(this, options);
  };
  util.inherits(AttendsEdge, Edge);
  AttendsEdge.prototype.fromNodeType = 'student';
  AttendsEdge.prototype.type = 'attends';
  AttendsEdge.prototype.toNodeType = 'class';
  AttendsEdge.raw2id = function (raw) { return AttendsEdge.prototype.type + '-' + raw.student.id + '-' + raw.class.id };

  var AttendedByEdge = function (options) {
    this.id = this.type + '-' + options.raw.class.id + '-' + options.raw.student.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.class);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.student);
    Edge.call(this, options);
  };
  util.inherits(AttendedByEdge, Edge);
  AttendedByEdge.prototype.fromNodeType = 'class';
  AttendedByEdge.prototype.type = 'attendedBy';
  AttendedByEdge.prototype.toNodeType = 'student';
  AttendedByEdge.raw2id = function (raw) { return AttendedByEdge.prototype.type + '-' + raw.class.id + '-' + raw.student.id };

  var HeadOfEdge = function (options) {
    this.id = this.type + '-' + options.raw.teacher.id + '-' + options.raw.department.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.teacher);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.department);
    Edge.call(this, options);
  };
  util.inherits(HeadOfEdge, Edge);
  HeadOfEdge.prototype.fromNodeType = 'teacher';
  HeadOfEdge.prototype.type = 'headOf';
  HeadOfEdge.prototype.toNodeType = 'department';
  HeadOfEdge.raw2id = function (raw) { return HeadOfEdge.prototype.type + '-' + raw.teacher.id + '-' + raw.department.id };

  var StudentRepOfEdge = function (options) {
    this.id = this.type + '-' + options.raw.student.id + '-' + options.raw.department.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.student);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.department);
    Edge.call(this, options);
  };
  util.inherits(StudentRepOfEdge, Edge);
  StudentRepOfEdge.prototype.fromNodeType = 'student';
  StudentRepOfEdge.prototype.type = 'studentRepOf';
  StudentRepOfEdge.prototype.toNodeType = 'department';
  StudentRepOfEdge.raw2id = function (raw) { return StudentRepOfEdge.prototype.type + '-' + raw.student.id + '-' + raw.department.id };

  var ProvidedByEdge = function (options) {
    this.id = this.type + '-' + options.raw.class.id + '-' + options.raw.department.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.class);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.department);
    Edge.call(this, options);
  };
  util.inherits(ProvidedByEdge, Edge);
  ProvidedByEdge.prototype.fromNodeType = 'class';
  ProvidedByEdge.prototype.type = 'providedBy';
  ProvidedByEdge.prototype.toNodeType = 'department';
  ProvidedByEdge.raw2id = function (raw) { return ProvidedByEdge.prototype.type + '-' + raw.class.id + '-' + raw.department.id };

  var ProvidesEdge = function (options) {
    this.id = this.type + '-' + options.raw.department.id + '-' + options.raw.class.id;
    this.fromNode = options.factory.createOrUpdateNode(this.fromNodeType, options.raw.department);
    this.toNode = options.factory.createOrUpdateNode(this.toNodeType, options.raw.class);
    Edge.call(this, options);
  };
  util.inherits(ProvidesEdge, Edge);
  ProvidesEdge.prototype.fromNodeType = 'department';
  ProvidesEdge.prototype.type = 'provides';
  ProvidesEdge.prototype.toNodeType = 'class';
  ProvidesEdge.raw2id = function (raw) { return ProvidesEdge.prototype.type + '-' + raw.department.id + '-' + raw.class.id };

  /* FACTORY */

  var SchoolFactory = function (options) {
    Factory.call(this, _.extend({
      nodeClasses: this.nodeClasses,
      edgeClasses: this.edgeClasses
    }, options));
  };
  util.inherits(SchoolFactory, Factory);
  SchoolFactory.prototype.nodeClasses = [ DepartmentNode, TeacherNode, ClassNode, StudentNode ];
  SchoolFactory.prototype.edgeClasses = [ TeachesEdge, TaughtByEdge, AttendsEdge, AttendedByEdge, HeadOfEdge, StudentRepOfEdge, ProvidedByEdge, ProvidesEdge ];

  /* GRAPH */

  var SchoolGraph = function (options) {
    options = options || {};
    Graph.call(this, _.extend({
      factory: options.factory || new SchoolFactory(options.schoolFactoryOptions)
    }, options));
  };
  util.inherits(SchoolGraph, Graph);

  /* Exports */

  return {
    DepartmentNode: DepartmentNode,
    TeacherNode: TeacherNode,
    ClassNode: ClassNode,
    StudentNode: StudentNode,

    TeachesEdge: TeachesEdge,
    TaughtByEdge: TaughtByEdge,
    AttendsEdge: AttendsEdge,
    AttendedByEdge: AttendedByEdge,
    HeadOfEdge: HeadOfEdge,
    StudentRepOfEdge: StudentRepOfEdge,
    ProvidedByEdge: ProvidedByEdge,
    ProvidesEdge: ProvidesEdge,

    SchoolFactory: SchoolFactory,
    SchoolGraph: SchoolGraph
  };
};
