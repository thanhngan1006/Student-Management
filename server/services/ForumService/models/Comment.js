const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
    {
        post_id: { type: Schema.Types.ObjectId, ref: 'posts', required: true },
        author_id: { type: String, required: true },
        author_name: { type: String },
        content: { type: String, default: "Commented" },
        created_at: { type: Date, default: Date.now }
    }
);
  
module.exports = mongoose.model('comments', CommentSchema);
  