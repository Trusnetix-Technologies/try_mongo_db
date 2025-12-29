const Student = require("../models/Student");

module.exports = (app) => {
  // ============================================
  // ======== CREATE - Insert Operations ========
  // ============================================

  // 1. Create a single student
  app.post("/api/v1/students/create", async (req, res) => {
    try {
      const student = await Student.create(req.body);
      res.status(201).json({
        success: true,
        data: student,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  });

  // 2. Create multiple students (insertMany)
  app.post("/api/v1/students/create/bulk", async (req, res) => {
    try {
      const students = await Student.insertMany(req.body);
      res.status(201).json({
        success: true,
        count: students.length,
        data: students,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // ========= READ - Query Operations ==========
  // ============================================

  // 3. Get all students
  app.get("/api/v1/students/get", async (req, res) => {
    try {
      const students = await Student.find().sort({ createdAt: -1 });

      res.json({
        success: true,
        count: students.length,
        data: students,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // 4. Get student by ID
  app.get("/api/v1/students/get/:id", async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // 5. Query with OPERATORS - $gte, $in, $or
  app.get("/api/v1/students/filter", async (req, res) => {
    try {
      const { minMarks, courses, city } = req.query;

      let query = {};

      // $gte operator - marks greater than or equal to
      if (minMarks) {
        query.marks = { $gte: parseInt(minMarks) };
      }

      // $in operator - course in array of courses
      if (courses) {
        query.course = { $in: courses.split(",") };
      }

      // $or operator - students from specific city OR with high marks
      // Example: Students from Mumbai OR students with marks >= minMarks
      if (city && minMarks) {
        query.$or = [{ city: city }, { marks: { $gte: parseInt(minMarks) } }];
        delete query.marks; // Remove the marks field since we're using $or
      }

      const students = await Student.find(query);

      res.json({
        success: true,
        description: "Filtered students using $gte, $in, $or operators",
        count: students.length,
        data: students,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // 6. REGEX Search - Find students by name pattern
  app.get("/api/v1/students/search/:name", async (req, res) => {
    try {
      const students = await Student.find({
        name: { $regex: req.params.name, $options: "i" }, // using options "i" to ignore case
      });

      res.json({
        success: true,
        description: `Students matching '${req.params.name}' (case-insensitive)`,
        count: students.length,
        data: students,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // ======== UPDATE - Update Operations ========
  // ============================================

  // 7. Update student by ID
  app.put("/api/v1/students/update/:id", async (req, res) => {
    try {
      const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  });

  // 8. Update with OPERATORS - $inc, $push, $set
  app.put("/api/v1/students/update/:id/operators", async (req, res) => {
    try {
      const student = await Student.findByIdAndUpdate(
        req.params.id,
        {
          $inc: { marks: 5 }, // Increment marks by 5
          $push: { subjects: "AI" }, // Add to subjects array
          $set: { enrolled: true }, // Set enrolled field
        },
        { new: true }
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      res.json({
        success: true,
        description: "Updated using $inc, $push, $set operators",
        data: student,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // ======== DELETE - Delete Operations ========
  // ============================================

  // 9. Delete student by ID
  app.delete("/api/v1/students/delete/:id", async (req, res) => {
    try {
      const student = await Student.findByIdAndDelete(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      res.json({
        success: true,
        message: "Student deleted successfully",
        data: student,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // =============== AGGREGATION ================
  // ============================================

  // 10. Aggregation - Group by course with statistics
  app.get("/api/v1/students/stats", async (req, res) => {
    try {
      const result = await Student.aggregate([
        {
          $group: {
            _id: "$course",
            totalStudents: { $sum: 1 }, // 1 means adding one for each document (student)
            averageMarks: { $avg: "$marks" },
            maxMarks: { $max: "$marks" },
            minMarks: { $min: "$marks" },
          },
        },
        {
          $sort: { averageMarks: -1 }, // sorting groups in descending order of averageMarks
        },
      ]);

      res.json({
        success: true,
        description:
          "Course-wise statistics using $group, $sum, $avg, $max, $min",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
};
