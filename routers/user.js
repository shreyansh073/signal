const User = require('../models').Users;
const School = require('../models').Schools;

const sharp = require('sharp');
const multer = require('multer');
const multerS3 = require('multer-s3')
const AWS = require('aws-sdk')

const auth = require('../middleware/auth')
const path = require('path');
const fs = require('fs');
const {isValidUsername} = require('../util/util')
const index = require('../util/algolia')
const { Expo } = require('expo-server-sdk');
const {pushNotification} = require('../util/expo')

const express = require('express')
const router = new express.Router()

const aws_accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const aws_secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new AWS.S3({
    accessKeyId: aws_accessKeyId,
    secretAccessKey: aws_secretAccessKey,
    region: "us-east-2"
});

const upload = multer({                 
    limits: {                           
        fileSize: 1000000              
    },                                 
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please provide a jpg, jpeg or png file'));
        }
        cb(null, true);
    },
    storage: multerS3({
        s3: s3,
        bucket: 'cometclub',
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString())
        }
    })
})

router.post('/user/avatar', auth, upload.single('avatar'), async (req,res) => {
    try{
        req.user.avatarUrl = req.file.location;
        await req.user.save()

        // add to algolia
        await index.partialUpdateObject({
            objectID: req.user.id,
            avatarUrl: req.user.avatarUrl
        })
        res.send(req.user.avatarUrl)
    }catch(e){
        console.log(e);
        res.status(404).send('error: avatar could not be created')
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/user/avatar', auth, async (req,res)=>{
    try {
        res.send(req.user.avatarUrl);
    } catch (e) {
        res.status(404).send()
    }
})

router.delete('/user/avatar', auth, async (req,res) => {
    req.user.avatarUrl = null;
    await req.user.save()
    // add to algolia
    await index.partialUpdateObject({
        objectID: req.user.id,
        avatarUrl: req.user.avatarUrl
    })
    res.send()
})

router.get('/user/me', auth, async (req,res) => {
    return res.send(req.user.serializeAuthenticatedUser())
})

router.patch('/user/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    //ensure username is unique
    const allowedUpdates = ['name', 'bio', 'work', 'username', 'SchoolId'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach(async (update) => {
            if(update == 'SchoolId' && req.body.SchoolId){
                await req.user.setSchool(req.body.SchoolId)
            }else{
                req.user[update] = req.body[update]
            }
        })
        await req.user.save()
        // add to algolia
        await index.saveObject({
            objectID: req.user.id,
            name: req.user.name,
            username: req.user.username,
            SchoolId: req.user.SchoolId,
            work: req.user.work,
            avatarUrl: req.user.avatarUrl
        })

        res.send(req.user.serializeAuthenticatedUser())
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
});

router.get('/user/exists', async (req,res) => {
    if(!isValidUsername(req.query.username)){
        return res.status(400).send('invalid username')
    }
    const user = await User.findOne({where: { username: req.query.username}})
    if(user){
        res.send({exists: true})
    }
    else{
        res.send({exists: false})
    }
})

router.get('/user/profile', auth, async (req,res) => {
    try{
        const user = await User.findOne({where: { id: req.query.id}});
        res.send(user)
    }catch(e){
        console.log(e);
        res.status(400).send('could not fetch user')
    }
})

router.get('/user/school', auth, async (req,res) => {
    try{
        const schools = await School.findAll();
        res.send(schools)
    }catch(e){
        console.log(e);
        res.status(400).send()
    }
})

router.post('/user/expo', auth, async (req,res) => {
    if (!Expo.isExpoPushToken(req.body.expoToken)) {
        console.error(`Push token ${req.body.expoToken} is not a valid Expo push token`);
        res.status(400).send("Invalid expo token")
    }

    req.user.expoToken = req.body.expoToken;
    await req.user.save()
    res.send()
})

router.get('/user/expo',auth, async (req,res) => {
    res.send(req.user.expoToken)
})

router.post('/user/notification', async (req,res) => {
    try{
        pushNotification(req.user.expoToken, 'Test','Test');
        res.send()
    }catch(e){
        console.log(e);
        res.status(400).send()
    }
    
})

module.exports = router