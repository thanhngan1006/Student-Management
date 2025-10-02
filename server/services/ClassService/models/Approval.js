const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema({
  class_id: {
    type: String,
    required: true
  },
  class_name: {
    type: String,
    required: true
  },
  school_year: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/ // Format: "YYYY-YYYY"
  },
  students: [
    {
      student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      hk1: {
        gpa: {
          type: Number,
          required: true
        },
        behavior: {
          type: String,
          required: true
        }
      },
      hk2: {
        gpa: {
          type: Number,
          required: true
        },
        behavior: {
          type: String,
          required: true
        }
      },
      submitted_at: {
        type: Date,
        default: Date.now
      }
    }
  ],
  submitted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Approval", approvalSchema);