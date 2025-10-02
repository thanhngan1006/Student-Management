const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
    {
        class_id: { type: String, required: true },              
        author_id: { type: String, required: true },              
        author_name: { type: String },                            
        content: { type: String, default: "Posted" },
        comments: [{ type: Schema.Types.ObjectId, ref: 'comments' }],
        liked_by: [{ type: String }],                             
        created_at: { type: Date, default: Date.now }
    }
);
  
module.exports = mongoose.model('posts', PostSchema);
  