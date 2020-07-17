const User = require('../models').User;
const {Op} = require('sequelize');
const validator = require('validator');
const bcrypt = require('bcrypt')

const {SendWelcomeEmail, SendEmailVerificationEmail, SendPasswordResetEmail} = require('../util/email/send');

exports.signup = async (req,res) => {
    const data = req.body || {};

    if (!(data.email && data.password && data.name && data.username)) {
		return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (data.email && !validator.isEmail(data.email)) {
		return res.status(400).json({ error: 'Invalid or malformed email address.' });
	}

	if (data.username && !validator.isAlphanumeric(data.username)) {
		return res.status(400).json({
			error: 'Usernames must be alphanumeric',
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
        // await SendWelcomeEmail({email: user.email, otp: user.OTP});
        // await SendEmailVerificationEmail({email: user.email, otp: user.OTP});
        return res.send(user.serializeAuthenticatedUser())
    }
    catch(e){
        res.status(400).send('cannot create user')
    }        
}

exports.verifyEmail = async (req,res) => {
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

exports.verifyOTP = async (req,res) => {
    const user = await User.findOne({where: {email: req.body.email}})
    
    if(user){
        console.log(user)
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
}

exports.login = async (req,res) => {
    const data = req.body || {};

    if (!((data.email || data.username) && data.password)) {
		return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (data.email && !validator.isEmail(data.email)) {
		return res.status(400).json({ error: 'Invalid or malformed email address.' });
	}

	if (data.username && !validator.isAlphanumeric(data.username)) {
		return res.status(400).json({
			error: 'Usernames must be alphanumeric',
		});
	}

    let user;
    if(data.email){
        user = await User.findOne({where: {email: data.email}})
    }
    else if(data.username){
        user = await User.findOne({where: {username: data.username}})
    }
        
    if(!user || !(await user.validPassword(data.password))){
        res.status(400).send('invalid email or password') 
    }
    res.send(user.serializeAuthenticatedUser())
}

exports.forgotPassword = async (req,res) => {
    const user = await User.findOne({where: {email: req.body.email}})
    if(user){
        await user.setOTP();
        await SendPasswordResetEmail({email: user.email, otp: user.OTP})
    }
    else{
        res.status(400).send('invalid email');
    }
    res.send('password reset email sent')
}

exports.resetPassword = async (req,res) => {
    const pass = await bcrypt.hash(req.body.password, 8)
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
}