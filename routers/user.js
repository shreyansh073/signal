const User = require('../models').User;
const sharp = require('sharp');
const multer = require('multer');

const auth = require('../middleware/auth')

const express = require('express')
const router = new express.Router()

router.get('/user/me', auth, async (req,res) => {
    return res.send(req.user)
})
const storage = multer.memoryStorage()
const upload = multer({                 // No dest parameter provided because we
    limits: {                           // do not want to save the image in the 
        fileSize: 1000000               // filesystem. We wanna access the binary
    },                                  // data in the router function.
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