const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const LoginInfoSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    }, 
    { 
        timestamps: true 
    }
);

module.exports = mongoose.model('logininfos', LoginInfoSchema);
