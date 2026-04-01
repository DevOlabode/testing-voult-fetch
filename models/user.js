const mongoose = reqiure('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    email : {
        type : String,
        required : true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    username : {
        type : String,
        reqiured : true,
        unique : true
    },
    name : {
        type : String,
        required : true,
        trim : true
    }
})

module.exports = mongoose.model('User', userSchema);