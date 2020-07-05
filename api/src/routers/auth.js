const express = require('express')
const router = new express.Router()
const User = require('../models/user')

router.post('/auth/signup', async (req,res) => {
    // add a check if user already exists, then hit signin api
    const user = new User(req.body)
    try{
        await user.save();
        res.json(user.serializeAuthenticatedUser());
    } catch(err){
        res.status(400).send('cannot create user')
    }
});

router.post('/auth/login', async (req,res) => {
    let user;
    if(req.body.email){
        user = await User.findOne({email: req.body.email.toLowerCase().trim()})
    }
    else if(req.body.username){
        user = await User.findOne({username: req.body.username.toLowerCase().trim()})
    }

    if (!user) {
		return res.status(404).json({ error: 'Resource does not exist.' });
	}

	if (!(await user.verifyPassword(req.body.password))) {
		return res.status(403).json({ error: 'Invalid username or password.' });
	}
    res.status(200).send(user.serializeAuthenticatedUser());
});

router.post('/auth/forgot', async (req,res) => {
    console.log('forgot');
    res.send('forgot');
});


router.post('/auth/reset', async (req,res) => {
    console.log('reset');
    res.send('reset');
});

module.exports = router