const express = require('express')
const router = new express.Router()
const User = require('../models/user')

router.get('/user', async (req,res) => {
    const user = await User.findOne({email: req.user.email})
    const serialized_user = user.serializeAuthenticatedUser();
    res.send(serialized_user)
})

module.exports = router