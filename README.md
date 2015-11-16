# graph-calc

[![Build Status](https://travis-ci.org/electronifie/graph-calc.svg?branch=master)](https://travis-ci.org/electronifie/graph-calc)

## Constructing the graph

### Setup

A more complete setup can be found [here](https://github.com/electronifie/graph-calc/blob/13a808c4270b641ee8fb50e5c6e9961b62f5ffbd/test/_SchoolGraph.js#L124-L124).

```javascript
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

    var SchoolFactory = function (options) {
      Factory.call(this, _.extend({
        nodeClasses: this.nodeClasses,
        edgeClasses: this.edgeClasses
      }, options));
    };
    util.inherits(SchoolFactory, Factory);
    SchoolFactory.prototype.nodeClasses = [ TeacherNode, ClassNode ];
    SchoolFactory.prototype.edgeClasses = [ TeachesEdge ];

    var SchoolGraph = function (options) {
      options = options || {};
      Graph.call(this, _.extend({
        factory: options.factory || new SchoolFactory(options.schoolFactoryOptions)
      }, options));
    };
    util.inherits(SchoolGraph, Graph);
```

### Node / Edge creation

Create an edge, automatically creating the node if it doesn't exist ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/1_graph.js)):

```javascript
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Physics' } });
```

### Traversal

Traverse the full graph ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/2_traverser.js)):

```javascript
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
      // Options to control the traversal:
      // onlyNodeTypes: ['nodeType', ...],
      // onlyEdgeTypes: ['edgeType', ...],
      // excludeNodeTypes: ['nodeType', ...],
      // excludeEdgeTypes: ['edgeType', ...],
      // maxDepth: 3,
      // allowLoops: true/false,
      // shouldVisitNode: function (node) { return true/false; },
      // shouldTraverseEdge: function (edge) { return true/false; },
    });
    traverser.traverse(startNode);
```

Traverse along a path of edge types ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/3_pathTraverser.js)):

```javascript
    var traverser = new PathTraverser({
      path: [ 'teaches' /* -> CLASS */, 'attendedBy' /* -> STUDENT */ ],
      onLeafNode: function (node, meta) { ... }
    });
    traverser.traverse(teacherNode);
```

### Calculation

Perform relationship-based calculations, and queries of the graph aided by lodash ([more examples](https://github.com/electronifie/graph-calc/blob/master/test/4_calculator.js)):

```javascript
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

