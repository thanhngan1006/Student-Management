const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubjectSchema = new Schema(
    {
        subject_name: { type: String, required: true },
        subject_code: { type: String, required: true, unique: true },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('subjects', SubjectSchema);
