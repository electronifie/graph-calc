var _ = require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var SchoolGraphClasses = require('./_SchoolGraph');
var Calculator = require('..').Calculator;

describe('Calculator', function () {

  var SchoolClasses;
  var SchoolGraph;
  var graph;

  beforeEach(function () {
    SchoolClasses = SchoolGraphClasses();
    SchoolGraph = SchoolClasses.SchoolGraph;

    graph = new SchoolGraph();

    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Bill' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Bill' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Bill' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Bill' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('teaches', { teacher: { id: 'Sue' }, class: { id: 'English' } });
    graph.factory.createOrUpdateEdge('taughtBy', { teacher: { id: 'Sue' }, class: { id: 'English' } });

    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Bobby' }, class: { id: 'English' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Bobby' }, class: { id: 'English' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Jo' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Jo' }, class: { id: 'Chemistry' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Jo' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Jo' }, class: { id: 'Physics' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Jo' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Jo' }, class: { id: 'Biology' } });
    graph.factory.createOrUpdateEdge('attends', { student: { id: 'Jo' }, class: { id: 'ComputerScience' } });
    graph.factory.createOrUpdateEdge('attendedBy', { student: { id: 'Jo' }, class: { id: 'ComputerScience' } });

    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Chemistry' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Physics' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Physics' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'Biology' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'Biology' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'ComputerScience' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'ComputerScience' }, department: { id: 'Science' } });
    graph.factory.createOrUpdateEdge('provides', { class: { id: 'English' }, department: { id: 'Arts' } });
    graph.factory.createOrUpdateEdge('providedBy', { class: { id: 'English' }, department: { id: 'Arts' } });

    graph.factory.createOrUpdateEdge('headOf',  { teacher: { id: 'Sue' }, department: { id: 'Science' } });
  });

  describe('#start, #finish, #calculate', function () {
    it('builds calculations with access to lodash functions', function () {

      // A trivial calculator that calculates 2 * node.id.length
      var calculator = new Calculator({ acceptsNodeType: 'student' })
          // build the calculation
          .start()
            // -> StudentNode(student-Bobby) (i.e. the node passed to calculate(...))
            .thru(function (node) { return [node.id, node.id]; })
            // -> [student-Bobby, student-Bobby]
            .map(function (nodeId) { return nodeId.length; })
            // -> [13, 13]
            .reduce(function (memo, node) { return node + memo; }, 0)
            // -> 26
          .finish();

      var studentBobby = graph.factory.getNode('student', 'student-Bobby');
      var bobbyResult = calculator.calculate(studentBobby);
      assert.deepEqual(bobbyResult, 26);

      var studentJo = graph.factory.getNode('student', 'student-Jo');
      var joResult = calculator.calculate(studentJo);
      assert.deepEqual(joResult, 20);
    });
  });

  describe('#start -> #withNodes', function () {
    it('performs a path based traversal from the root node, passing an array of the nodes collected to the next function', function () {
      var targetNode = graph.factory.getNode('student', 'student-Bobby');

      // Student classes by department
      var calculator = new Calculator({ acceptsNodeType: 'student' })
        .start()
          .withNodes({ path: ['attends' /* -> CLASS */, 'providedBy' /* -> DEPARTMENT */], revisitNodes: true })
          .map(function (node) { return node.id; })
          .countBy()
        .finish();

      var result = calculator.calculate(targetNode);
      assert.deepEqual(result, {
        'department-Science': 2,
        'department-Arts': 1
      });
    });
  });

  describe('#start -> #saveAs, #withSaved, #withAllSaved', function () {
    it('provides a way to store + retrieve partial results during the calculation', function () {
      var targetNode = graph.factory.getNode('student', 'student-Bobby');

      // Student classes by department
      var calculator = new Calculator({ acceptsNodeType: 'student' })
        .start()
          .thru(function () { return [1, 2, 3, 4]; })
          .saveAs('base')

          .tap(function (currentVal) { assert.deepEqual(currentVal, [1, 2, 3, 4]); })

          .reduce(function (m, n) { return m + n; }, 0)
          .saveAs('sumOfBase')

          .tap(function (currentVal) { assert.deepEqual(currentVal, 10); })

          .withSaved('base')

          .tap(function (base) { assert.deepEqual(base, [1, 2, 3, 4]); })

          .reduce(function (m, n) { return m * n; }, 1)
          .saveAs('productOfBase')

          .tap(function (currentVal) { assert.deepEqual(currentVal, 24); })

          .withAllSaved()

          .tap(function (allSaved) { assert.deepEqual(allSaved, { base: [1, 2, 3, 4], sumOfBase: 10, productOfBase: 24 }); })

          .thru(function (allSaved) { return allSaved.sumOfBase + allSaved.productOfBase; })

        .finish();

      var result = calculator.calculate(targetNode);
      assert.equal(result, 34);

    });
  });

  describe('#start -> #mapCalc', function () {
    it('maps sub-calculations', function () {
      var targetNode = graph.factory.getNode('teacher', 'teacher-Sue');

      var classByDepartmentCalculator = new Calculator({ acceptsNodeType: 'student' })
        .start()
          .withNodes({ path: ['attends' /* -> CLASS */, 'providedBy' /* -> DEPARTMENT */], revisitNodes: true })
          .map(function (node) { return node.id; })
          .countBy()
        .finish();

      var teacherStudentCalculator = new Calculator({ acceptsNodeType: 'teacher' })
        .start()
          .withNodes({ path: ['teaches' /* -> CLASS */, 'attendedBy' /* -> STUDENT */], revisitNodes: false })
          .mapCalc(classByDepartmentCalculator)
        .finish();

      var result = teacherStudentCalculator.calculate(targetNode);
      assert.deepEqual(result, [{
        'department-Science': 2,
        'department-Arts': 1
      }, {
        'department-Science': 4
      }]);
    });
  });

  describe('#start -> #mapAndIndexCalc', function () {
    it('maps sub-calculations, indexing by nodeId', function () {
      var targetNode = graph.factory.getNode('teacher', 'teacher-Sue');

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
      assert.deepEqual(result, {
        'student-Bobby': {
          'department-Science': 2,
          'department-Arts': 1
        },
        'student-Jo': {
          'department-Science': 4
        }
      });
    });
  });

  describe('#calculateWithSaved', function () {
    it('returns a map of the saved values generated during the calculation, handy for debugging complex calculations.', function () {
      // SPEC:
      // A teacher's "productivity score" is calculated as a product of:
      //  - each student is worth 1 point per department, shared proportionally among their teachers in that deparment
      //  - 3 points for each class taught
      //  - an extra 25% of student points for being head of department
      //  - 10 points for being head of department

      // STEPS:
      // get student classes per department
      //    path:             ROOT - teaches - CLASS - attendedBy - STUDENT
      //    sub-path:         STUDENT - attends - CLASS - providedBy - DEPARTMENT
      //    result-format:    { STUDENT_NODE_ID: { DEPARTMENT_ID: CLASS_COUNT } }
      //    save-as:          studentClassesByDepartment
      //
      // get departments of classes taught
      //    path:             ROOT - teaches - CLASS
      //    sub-path          CLASS - providedBy - DEPARTMENT
      //    result-format:    { CLASS_ID: DEPARTMENT_ID }
      //    save-as:          taughtClassDepartments
      //
      // get students in classes taught
      //    path:             ROOT - teaches - CLASS
      //    sub-path:         CLASS - attendedBy - STUDENT
      //    result-format:    { CLASS_ID: [ STUDENT_ID ] }
      //    save-as:          studentsByClass
      //
      // get hod count
      //    path:             ROOT - headOf - DEPARTMENT
      //    result-format:    INT
      //    save-as:          hodCount
      //
      // calculate points per student class
      //    path:             -
      //    calculation:      studentClassPoints = {}
      //                      for (class, student) in studentsByClass:
      //                        if taughtClassDepartments[class]:
      //                          studentClassPoints[student][class] = 1 / studentClassesByDepartment[student][ taughtClassDepartments[class] ];
      //                      return studentClassPoints
      //    result-format:    { STUDENT_ID: { CLASS: POINT } }
      //    save-as:          studentClassPoints
      //
      // summarize student points
      //    path:             -
      //    calculation:      studentPoints = 0
      //                      for (student, class) in studentClassPoints: studentPoints += studentClassPoints[student][class]
      //                      return studentPoints
      //    result-format:    INT
      //    save-as:          studentPoints
      //
      // summarize class points
      //    path:             -
      //    calculation:      return taughtClassDepartments.keys.length * 3
      //    result-format:    INT
      //    save-as:          classPoints
      //
      // summarize hod weighted student points
      //    path:             -
      //    calculation:      return hodCount * 0.25 * studentPoints
      //    result-format:    INT
      //    save-as:          hodStudentPoints
      //
      // summarize hod points
      //    path:             -
      //    calculation:      return hodCount * 10
      //    result-format:    INT
      //    save-as:          hodPoints
      //
      // calculate total points
      //    path:             -
      //    calculation:      return hodPoints + hodStudentPoints + classPoints + studentPoints
      //    result-format:    INT
      //    save-as:          total

      var studentClassesByDepartmentCalculator = new Calculator({ acceptsNodeType: 'student' }).start()
        .withNodes({ path: [ 'attends' /* -> CLASS */, 'providedBy' /* -> DEPARTMENT */ ], revisit: true })
          .map(function (node) { return node.id; })
          .countBy()
        .finish();

      var classDepartmentCalculator = new Calculator({ acceptsNodeType: 'class' }).start()
        .withNodes({ path: [ 'providedBy' /* -> DEPARTMENT */ ], revisit: false })
          .map(function (node) { return node.id; })
          .first()
        .finish();

      var classStudentsCalculator = new Calculator({ acceptsNodeType: 'class' }).start()
        .withNodes({ path: [ 'attendedBy' /* -> STUDENT */ ], revisit: false })
          .map(function (node) { return node.id; })
        .finish();

      var calculator = new Calculator({ acceptsNodeType: 'teacher' }).start()
        .withNodes({ path: [ 'teaches' /* -> CLASS */, 'attendedBy' /* -> STUDENT */ ], revisit: false })
          .mapAndIndexCalc(studentClassesByDepartmentCalculator)
          .saveAs('studentClassesByDepartment')

        .withNodes({ path: [ 'teaches' /* -> CLASS */ ], revisit: false })
          .saveAs('taughtClasses')

        .withSaved('taughtClasses')
          .mapAndIndexCalc(classDepartmentCalculator)
          .saveAs('taughtClassDepartments')

        .withSaved('taughtClasses')
          .mapAndIndexCalc(classStudentsCalculator)
          .saveAs('studentsByClass')

        .withNodes({ path: [ 'headOf' /* -> DEPARTMENT */ ], revisit: false })
          .thru(function (departmentNodes) { return departmentNodes.length; })
          .saveAs('hodCount')

        .withAllSaved()
          .thru(function (results) {
            var studentClassPoints = {};
            _.each(results.studentsByClass, function (studentIds, classId) {
              var classDepartment = results.taughtClassDepartments[ classId ];
              _.each(studentIds, function (studentId) {
                var studentClassesForDepartment = results.studentClassesByDepartment[ studentId ][ classDepartment ];
                var points = 1 / studentClassesForDepartment;
                studentClassPoints[ studentId ] = studentClassPoints[ studentId ] || {};
                studentClassPoints[ studentId ][ classId ] = points;
              });
            });
            return studentClassPoints;
          })
          .saveAs('studentClassPoints')

        .withSaved('studentClassPoints')
          .thru(function (studentClassPoints) {
            return _.chain(studentClassPoints)
              .values()
              .map(function (v) { return _.values (v); })
              .flatten().flatten()
              .sum()
              .value();
          })
          .saveAs('studentPoints')

        .withSaved('taughtClassDepartments')
          .thru(function (taughtClassDepartments) { return _.keys(taughtClassDepartments).length * 3; })
          .saveAs('classPoints')

        .withAllSaved()
          .thru(function (results) { return results.hodCount * 0.25 * results.studentPoints; })
          .saveAs('hodStudentPoints')

        .withSaved('hodCount')
          .thru(function (hodCount) { return hodCount * 10; })
          .saveAs('hodPoints')

        .withAllSaved()
          .thru(function (results) { return results.hodPoints + results.hodStudentPoints + results.classPoints + results.studentPoints })
          .saveAs('points')

        .finish();

      var teacherSueNode = graph.factory.getNode('teacher', 'teacher-Sue');
      var resultSue = calculator.calculateWithSaved(teacherSueNode);

      assert.deepEqual(
        resultSue.saved.studentClassesByDepartment,
        {
          'student-Bobby': { 'department-Science': 2, 'department-Arts': 1 },
          'student-Jo': { 'department-Science': 4 }
        }
      );

      assert.deepEqual(_.pluck(resultSue.saved.taughtClasses, 'id'), [ 'class-Biology', 'class-English' ]);

      assert.deepEqual(
        resultSue.saved.taughtClassDepartments,
        { 'class-Biology': 'department-Science', 'class-English': 'department-Arts' }
      );

      assert.deepEqual(
        resultSue.saved.studentsByClass,
        { 'class-Biology': [ 'student-Bobby', 'student-Jo' ], 'class-English': [ 'student-Bobby' ] }
      );

      assert.equal(resultSue.saved.hodCount, 1);

      assert.deepEqual(
        resultSue.saved.studentClassPoints,
        { 'student-Bobby': { 'class-Biology': 0.5, 'class-English': 1 }, 'student-Jo': { 'class-Biology': 0.25 } }
      );

      assert.equal(resultSue.saved.studentPoints, 1.75);            //  1.75    = 0.5 + 1 + 0.25
      assert.equal(resultSue.saved.classPoints, 6);                 //  6       = 2 * 3
      assert.equal(resultSue.saved.hodStudentPoints, 0.4375);       //  0.4375  = 1.75 * 0.25
      assert.equal(resultSue.saved.hodPoints, 10);                  // 10       = 1 * 10
                                                                    // --------
      assert.equal(resultSue.saved.points, 18.1875);                // 18.1875

      assert.equal(resultSue.result, 18.1875);

      var teacherBillNode = graph.factory.getNode('teacher', 'teacher-Bill');
      var resultBill = calculator.calculateWithSaved(teacherBillNode);

      assert.deepEqual(
          resultBill.saved.studentClassPoints,
          { 'student-Bobby': { 'class-Chemistry': 0.5 }, 'student-Jo': { 'class-Chemistry': 0.25, 'class-Physics': 0.25 } }
      );

      assert.equal(resultBill.saved.studentPoints, 1);               // 1       = 0.5 + 0.25 + 0.25
      assert.equal(resultBill.saved.classPoints, 6);                 // 6       = 2 * 3
      assert.equal(resultBill.saved.hodStudentPoints, 0);            // 0       = 0.75 * 0
      assert.equal(resultBill.saved.hodPoints, 0);                   // 0       = 0 * 10
                                                                     // --------
      assert.equal(resultBill.saved.points, 7);                      // 7

      assert.equal(resultBill.result, 7);

    });

  });
});
