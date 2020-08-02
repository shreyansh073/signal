const User = require('../models').User;
const {Op} = require('sequelize');
const validator = require('validator');
const bcrypt = require('bcrypt')
const {getStreamClient} = require('../util/stream')
const {isValidUsername, isValidPassword} = require('../util/util')
const {SendWelcomeEmail, SendEmailVerificationEmail, SendPasswordResetEmail} = require('../util/email/send');
const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')

router.post('/auth/signup', async (req,res) => {
    const data = req.body || {};

    if (!(data.email && data.password && data.name && data.username)) {
		return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (data.email && !validator.isEmail(data.email)) {
		return res.status(400).json({ error: 'Invalid or malformed email address.' });
	}

	if (data.username && !isValidUsername(data.username)) {
		return res.status(400).json({
			error: 'Usernames must be valid',
		});
    }
    
    if (data.password && !isValidPassword(data.password)){
        return res.status(400).json({
			error: 'Password must be minimum 8 characters long',
		});
    }

	data.username = data.username.trim();
	data.email = data.email.trim();

	const exists = await User.findOne({
        where: {
            [Op.or]: [
                { email: data.email }, 
                { username: data.username }
            ]
        }
	});

	if (exists) {
		return res.status(409).json({
			error: 'A resource already exists with that username or email.',
		});
	}

    try{
        const min = parseInt(process.env.MINOTP)
        const max = parseInt(process.env.MAXOTP)
        data.OTP = Math.round(Math.random() * (max - min) + min);
        data.OTPCreatedAt = Date.now();
        const user = await User.create(data);
        
        res.send(user.serializeAuthenticatedUser())

        // here if the following calls throw error then a 400 response will be sent again
        SendEmailVerificationEmail({email: user.email, otp: user.OTP});
    }
    catch(e){
        res.status(400).send('cannot create user')
    }        
})

router.post('/auth/login', async (req,res) => {
    const data = req.body || {};    

    if (!data.input || !data.password) {
		return res.status(400).json({ error: 'Missing required fields.' });
    }

    let user;
    if(validator.isEmail(data.input)){
        user = await User.findOne({where: {email: data.input}})
    }
    else if(isValidUsername(data.input)){
        user = await User.findOne({where: {username: data.input}})
    }
    else{
        return res.status(400).json({
			error: 'invalid username or email',
		});
    }        
    if(!user){
        return res.status(409).json({
			error: 'invalid username or email',
		});
    }
    if(!(await user.validPassword(data.password))){
        return res.status(400).json({
			error: 'invalid password',
		});
    }
    res.send(user.serializeAuthenticatedUser())
})

router.post('/auth/forgot-password', async (req,res) => {
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: req.body.input }, 
                { username: req.body.input }
            ]
        }
	});
    if(user){
        await user.setOTP();
        await SendPasswordResetEmail({email: user.email, otp: user.OTP});
        res.send('password reset email sent');
    }
    else{
        return res.status(400).send('invalid username or email');
    }
})

router.post('/auth/reset-password',async (req,res) => {
    const password = req.body.password;
    if (password && !isValidPassword(password)){
        return res.status(400).json({
			error: 'Password must be minimum 8 characters long',
		});
    }
    const pass = await bcrypt.hash(password, 8)
    let user;
    try{
        user = await User.update({
            password: pass
        },{
            where: {
                email: req.body.email
            }
        });
    }catch(err){
        console.log(err)
    }    

    if (!user) {
		return res.status(404).json({ error: 'Resource could not be found.' });
	}

    res.status(200).send(user.serializeAuthenticatedUser());
})

router.post('/auth/verify-otp', async (req,res) => {
    const user = await User.findOne({where: {email: req.body.email}})
    
    if(user){
        if(user.isValidOTP(req.body.otp)){        
            res.send({isVerified: true})
        }
        else{
            res.send({isVerified: false})
        }
    }
    else{
        res.status(400).send('invalid email')
    }    
})

router.post('/auth/verify-email', async (req,res) => {
    const user = User.findOne({where: {email: req.body.email}})
    if(user){
        await user.setOTP();
        await SendEmailVerificationEmail({email: user.email, otp: user.OTP});
    }
    else{
        res.status(400).send('invalid email');
    }
    res.send('email verification email sent');
}
)

router.post('/auth/welcome', auth, (req,res) => {
    const user = req.user;
    SendWelcomeEmail({email: user.email, name: user.OTP});
})
module.exports = router
