const validator = require('validator')

function isValidUsername(username){
    const regex = RegExp('^[a-zA-Z0-9_.]+$')
    return regex.test(username)
}

function isValidPassword(password){
    return password.length > 7;
}

module.exports = {isValidUsername, isValidPassword}