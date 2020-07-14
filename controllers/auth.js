const User = require('../models').User;

exports.signup = async (req,res) => {
    try{
        const user = await User.create(req.body);
        res.send(user)
    }
    catch(e){
        res.status(400).send('cannot create user')
    }        
}

exports.login = async (req,res) => {
    console.log('login')
    res.send('login')
}

exports.forgot = async (req,res) => {
    console.log('forgot')
    res.send('forgot')
}

exports.reset = async (req,res) => {
    console.log('reset')
    res.send('reset')
}