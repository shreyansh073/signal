const multer = require('multer');

const upload = multer({
    limits: {
        //file size should be less than 1 MB
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
});

module.exports = {upload}