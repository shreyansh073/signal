const User = require('../models').User;
const Post = require('../models').Post;

const sharp = require('sharp');
const multer = require('multer');

const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')
const {isValidUsername} = require('../util/util')

const express = require('express')
const router = new express.Router()

router.get('/user/me', auth, async (req,res) => {
    return res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'bio', 'work', 'location']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/user/exists', async (req,res) => {
    if(!isValidUsername(req.body.username)){
        return res.status(400).send('invalid username')
    }
    const user = await User.findOne({where: { username: req.body.username}})
    if(user){
        res.send({exists: true})
    }
    else{
        res.send({exists: false})
    }
})

const storage = multer.memoryStorage()
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
    storage: storage
})

router.post('/user/avatar', auth, upload.single('avatar'), async (req,res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/user/avatar', auth, async (req,res)=>{
    try {
        res.set('Content-Type', 'image/png')
        res.send(req.user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

router.delete('/user/avatar', auth, async (req,res) => {
    req.user.avatar = null;
    await req.user.save()
    res.send()
})

module.exports = router