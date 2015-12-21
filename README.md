# graph-calc

[![Build Status](https://travis-ci.org/electronifie/graph-calc.svg?branch=master)](https://travis-ci.org/electronifie/graph-calc)

## Getting started

**Install** `npm install graph-calc --save`

**Test** `npm test`

**Generate Docs** `npm doc`

<hr>

## Constructing the graph

### Setup

A more complete setup can be found [here](https://github.com/electronifie/graph-calc/blob/13a808c4270b641ee8fb50e5c6e9961b62f5ffbd/test/_SchoolGraph.js#L124-L124).

```javascript
var Edge = require('graph-calc').Edge;
var Factory = require('graph-calc').Factory;
var Graph = require('graph-calc').Graph;
var Node = require('graph-calc').Node;
var util = require('util');

/* create node types */

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

/* create an edge type */

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

/* create the graph, registering the nodes/edges via a Factory */

var schoolGraph = new Graph ({
  factory: new Factory({
    nodeClasses: [ TeacherNode, ClassNode ],
    edgeClasses: [ TeachesEdge ]
  });
});

```

### Node / Edge creation

Create an edge, automatically creating the node if it doesn't exist ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/1_graph.js)):

```javascript
  schoolGraph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
  schoolGraph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Physics' } });
```

### Traversal

Traverse the full graph ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/6_traverser.js)):

```javascript
var Traverser = require('graph-calc').Traverser;

var startNode = graph.factory.getNode('teacher', 'teacher-Sue');
var traverser = new Traverser({
  onVisitNode: function (node, meta) {
    var path = meta.path;
    var depth = meta.path;
    var viaEdge = meta.viaEdge;
    var previouslyVisited = meta.previouslyVisited;
    ...
  },
  onTraverseEdge: function (edge) { ... },
  // Other options:
  // onlyNodeTypes: ['teacher', 'student', ...],
  // onlyEdgeTypes: ['teaches', ...],
  // excludeNodeTypes: ['teacher', ...],
  // excludeEdgeTypes: ['teaches', ...],
  // maxDepth: 3,
  // allowLoops: true,
  // shouldVisitNode: function (node) { return true; },
  // shouldTraverseEdge: function (edge) { return true; },
});
traverser.traverse(startNode);
```

Traverse along a path of edge types ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/7_pathTraverser.js)):

```javascript
var PathTraverser = require('graph-calc').PathTraverser;

var traverser = new PathTraverser({
  path: [ 'teaches' /* -> CLASS */, 'attendedBy' /* -> STUDENT */ ],
  onLeafNode: function (node, meta) { ... }
});
traverser.traverse(teacherNode);
```

### Calculation

Perform relationship-based calculations, and queries of the graph aided by lodash ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/8_calculator.js)):

```javascript
var Calculator = require('graph-calc').Calculator;

var classByDepartmentCalculator = new Calculator({ acceptsNodeType: 'student' })
  .start()
    .withNodes({ path: ['attends' /* -> CLASS */, 'providedBy' /* -> DEPARTMENT */], revisitNodes: true })
    .map(function (node) { return node.id; })
    .countBy()
  .finish();

var teacherStudentCalculator = new Calculator({ acceptsNodeType: 'teacher' })
  .start()
    .withNodes({ path: ['teaches' /* -> CLASS */, 'attendedBy' /* -> STUDENT */], revisitNodes: false })
    .mapAndIndexCalc(classByDepartmentCalculator)
  .finish();

var result = teacherStudentCalculator.calculate(targetNode);

// e.g result:
// {
//   'student-Bobby': {
//     'department-Science': 2,
//     'department-Art': 1
//   },
//   'student-Jo': {
//     'department-Science': 4
//   }
// }
```

### Events

Subscribe to events within a node's network ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/10_networkSubscriber.js)):

```javascript
  var NetworkSubscriber = require('graph-calc').NetworkSubscriber;
  
  // Subscribe to all the 'grade-added' and 'report-due' (fictional) events for
  // all student's taught by a teacher.
  new NetworkSubscriber({
    node: graph.factory.getNode('teacher', 'teacher-Sue'),
    
    // Define the network
    maxDepth: 3,
    onlyEdgeTypes: ['teaches', 'attendedBy'],
    
    // Attach the listeners
    nodeEvents: {
      'grade-added': function (grade) { ... },
      'report-due': function (reportName) { ... }
    }
  });
```
