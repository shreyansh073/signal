const User = require('../models').User;
const sharp = require('sharp');
const multer = require('multer');


const getUser = async (req,res) => {
    const user = await User.findOne({where: {id: req.user.id}})
    return res.send(user)
}
const upload = multer({
    limits: {
        //file size should be less than 1 MB
        fileSize: 1000000
    },
    fileFilter: (req, file, cb) => {
        
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }
        console.log(file.originalname)
        return cb(null, true)
    },
    storage: multer.memoryStorage(),
    
}).single('avatar');

const uploadAvatar = async (upload,req,res) => {
    console.log(req)
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    try{
        const user = await User.findOne({where: {id: req.user.email}})
        user.avatar = buffer;
        await user.save();
        res.send()
    }catch(e){
        res.status(400).send('cannot upload file')
    }
}
  
const getAvatar = async (req,res) => {
    try {
        const user = await User.findOne({where: {id: req.user.id}})

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
}

module.exports = {uploadAvatar, getAvatar, getUser};