const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedSchema = new Schema(
    {
        class_id: { type: String, required: true }, 
        posts: [{ type: Schema.Types.ObjectId, ref: 'posts' }]
    }
);

module.exports = mongoose.model('feeds', FeedSchema);
