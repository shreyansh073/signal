const validator = require('validator')

function isValidUsername(username){
    return validator.isAlphanumeric(username)
}

module.exports = {isValidUsername}