const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScoreSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
        score: { type: Number, required: true },
        category: { type: String, required: true },
        subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'subjects', required: true },
        subject: { type: String, require: true },
        semester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'semesters', required: true },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('scores', ScoreSchema);
