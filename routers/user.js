const User = require('../models').Users;
const Post = require('../models').Posts;
const School = require('../models').Schools;

const sharp = require('sharp');
const multer = require('multer');

const auth = require('../middleware/auth')
const path = require('path');
const fs = require('fs');
const {getStreamClient} = require('../util/stream')
const {isValidUsername} = require('../util/util')

const express = require('express')
const router = new express.Router()

router.get('/user/me', auth, async (req,res) => {
    return res.send(req.user.serializeAuthenticatedUser())
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    //ensure username is unique
    const allowedUpdates = ['name', 'bio', 'work', 'username'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach(async (update) => {
            if(update == 'school'){
                const school = await School.findOne({where: {name: req.body.name}});
                await req.user.setSchool(school)
            }else{
                req.user[update] = req.body[update]
            }
        })
        await req.user.save()
        res.send(req.user.serializeAuthenticatedUser())
    } catch (e) {
        res.status(400).send(e)
    }
});

router.post('/user/school'. auth, async (req,res) => {
    try{
        const school = await School.findOne({where: {name: req.body.name}});
        await req.user.setSchool(school)
        res.send();
    }catch(e){
        console.log(e);
        res.status(400).send("could not update school")
    }
})

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images')
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user.id}.${file.originalname.split('.').pop()}`)
    }
});
const upload = multer({                 
    limits: {                           
        fileSize: 1000000              
    },
    dest: '../images/',                                 
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please provide a jpg, jpeg or png file'));
        }
        cb(null, true);
    },
    storage: storage
})

router.post('/user/avatar', auth, upload.single('avatar'), async (req,res) => {
    try{
        req.user.avatarUrl = "/images/"+req.file.filename; 
        await fs.readFile(path.join(process.cwd(), "/images/"+req.file.filename), async (err, filebuffer) =>{
            const buffer = await sharp(filebuffer).resize({ width: 250, height: 250 }).png().toBuffer()
            req.user.avatar = buffer
            await req.user.save()
        })
        res.send()
    }catch(e){
        console.log(e);
        res.status(404).send('error: avatar could not be created')
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/user/avatar', auth, async (req,res)=>{
    try {
        const temp_path = req.query.path ? req.query.path : req.user.avatarUrl;
        const image_path = path.join(process.cwd(), temp_path);
        res.sendFile(image_path);
    } catch (e) {
        res.status(404).send()
    }
})

router.delete('/user/avatar', auth, async (req,res) => {
    req.user.avatar = null;
    req.user.avatarUrl = null;
    await req.user.save()
    res.send()
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

module.exports = router