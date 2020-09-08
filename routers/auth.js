const User = require('../models').Users;
const {Op} = require('sequelize');
const validator = require('validator');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {getStreamClient} = require('../util/stream')
const {isValidUsername, isValidPassword} = require('../util/util')
const {SendWelcomeEmail, SendEmailVerificationEmail, SendPasswordResetEmail} = require('../util/email/send');
const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const index = require('../util/algolia')
const {pushNotification} = require('../util/expo')

router.post('/auth/signup', async (req,res) => {
    let data = req.body || {};
    data.email = data.email.toLowerCase()

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
        user.token = jwt.sign({email: user.email, id: user.id}, process.env.JWT_SECRET);
        await user.save()

        const sourceFeed = getStreamClient().feed('timeline', user.id);
        await sourceFeed.follow('user', user.id);

        //auto follow comet curators
        if(user.username !== "comet_curators"){
            const comet_curators = await User.findOne({where: {username:"comet_curators"}});
            const comet_curators_feed = getStreamClient().feed('timeline', comet_curators.id)

            await comet_curators_feed.follow('user', user.id)
            await sourceFeed.follow('user', comet_curators.id)

            await user.addDestination(comet_curators)
            await comet_curators.addDestination(user)

            user.followingCount = user.followingCount + 1;
            user.followerCount = user.followerCount + 1;
            await user.save()

            comet_curators.followingCount = comet_curators.followingCount + 1;
            comet_curators.followerCount = comet_curators.followerCount + 1;
            await comet_curators.save()

            // send push notification
            pushNotification(user.expoToken,`${comet_curators.username} started following you`, "Yay! Explore Comet to know what they’re sharing ",{avatarUrl: comet_curators.avatarUrl})

        }
        
        // add to algolia
        await index.saveObject({
            objectID: user.id,
            name: user.name,
            username: user.username,
            SchoolId: user.SchoolId,
            work: user.work,
            avatarUrl: user.avatarUrl
        })
    
        res.send(user.serializeAuthenticatedUser())

        // here if the following calls throw error then a 400 response will be sent again
        SendEmailVerificationEmail({email: user.email, otp: user.OTP, username: user.username, name: user.name});
    }
    catch(e){
        console.log(e)
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
        user = await User.findOne({where: {email: data.input.toLowerCase()}})
    }
    else if(isValidUsername(data.input)){
        user = await User.findOne({where: {username: data.input}})
    }
    else{
        return res.status(409).json({
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
    user.token = jwt.sign({email: user.email, id: user.id}, process.env.JWT_SECRET);
    await user.save()

    res.send(user.serializeAuthenticatedUser());
    if(!user.isVerified){
        SendEmailVerificationEmail({email: user.email, otp: user.OTP, username: user.username, name: user.name});
    }
})

router.post('/auth/forgot-password', async (req,res) => {
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: req.body.input.toLowerCase() }, 
                { username: req.body.input }
            ]
        }
	});
    if(user){
        await user.setOTP();
        await SendPasswordResetEmail({email: user.email, otp: user.OTP, username: user.username, name: user.name});
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
        user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: req.body.input.toLowerCase() }, 
                    { username: req.body.input }
                ]
            }
        });
        console.log(user)
        if (!user) {
            return res.status(404).json({ error: 'Resource could not be found.' });
        }
        user.password = pass;
        await user.save();
    }catch(err){
        console.log(err)
    }
    res.status(200).send(user.serializeAuthenticatedUser());
})

router.post('/auth/verify-otp', async (req,res) => {
    if(!req.body.input){
        return res.status(400).send('input is null')
    }
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: req.body.input.toLowerCase() }, 
                { username: req.body.input }
            ]
        }
    });
    
    if(user){
        const val = await user.isValidOTP(req.body.otp)
        res.send({isVerified: val})
    }
    else{
        res.status(400).send('invalid email')
    }    
})

router.post('/auth/verify-email', async (req,res) => {
    if(!req.body.input){
        return res.status(400).send('input is null')
    }
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: req.body.input.toLowerCase() }, 
                { username: req.body.input }
            ]
        }
    });
    if(user){
        await user.setOTP();
        await SendEmailVerificationEmail({email: user.email, otp: user.OTP, username: user.username, name: user.name});
    }
    else{
        res.status(409).send('invalid email or username');
    }
    res.send('email verification email sent');
}
)

router.post('/auth/welcome', auth, (req,res) => {
    const user = req.user;
    SendWelcomeEmail({email: user.email, name: user.name, username: user.username});
})

router.get('/status', (req,res) => {
    res.send({status: true})
})
module.exports = router
