const mongoose = require('mongoose')
const bcrypt = require('mongoose-bcrypt')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        bcrypt: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc,ret){
            delete ret.password;
        }
    },
    toObject: {
        transform: function(doc,ret){
            delete ret.password;
        }
    }
})

userSchema.plugin(bcrypt);

userSchema.methods.serializeAuthenticatedUser = function serializeAuthenticatedUser(){
    let user = this;
    let serialized = {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        username: user.username,
        jwt: jwt.sign({email: user.email, _id: user._id.toString()},'bits' )
    };
    return serialized;
}

const User = mongoose.model('User', userSchema)

module.exports = User
