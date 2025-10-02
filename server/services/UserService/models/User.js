const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "advisor", "admin"],
      required: true,
    },
    advisor_type: {
      type: [
        {
          type: String,
          enum: ["subject_teacher", "homeroom_teacher"],
        },
      ],
      required: function () {
        return this.role === "advisor";
      },
      validate: {
        validator: function (v) {
          return this.role !== "advisor" || (Array.isArray(v) && v.length > 0);
        },
        message: "advisor_type must not be empty if role is advisor",
      },
    },
    status: {
      type: String,
      enum: ["active", "graduated", "dropped"],
      default: "active",
    },

    graduation_year: {
      type: Number,
      validate: {
        validator: function (value) {
          if (value !== undefined && this.role !== "student") {
            return false;
          }
          return true;
        },
        message: "graduation_year is only allowed for students",
      },                                                 
    },
    repeat_years: {
      type: [
        {
          grade: { type: String, required: true },
          school_year: { type: String, required: true },
          reason: { type: String, default: 'Low academic performance' }
        }
      ],
      validate: {
        validator: function (v) {
          return this.role === "student" || (Array.isArray(v) && v.length === 0);
        },
        message: "Only students can have repeat_years"
      },
      default: []
    },    
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone_number: { type: String, required: true },
    parent_number: { type: String },
    parent_email: { type: String },
    address: { type: String },
    date_of_birth: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    tdt_id: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("users", UserSchema);
