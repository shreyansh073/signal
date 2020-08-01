const User = require('../models').User;
const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')

const express = require('express')
const router = new express.Router()

router.post('/follow', auth, async (req,res)=>{
    const dest = await User.findOne({where: {id:req.body.id}})
    if(!dest){
        res.status(400).send('can not follow user')
    }    
    try{
        await req.user.addDestination(dest);
        const sourceFeed = getStreamClient().feed('timeline', req.user.id);
        await sourceFeed.follow('user', dest.id, {limit: 20});
        res.send()
    }catch(e){
        res.status(400).send('can not follow user')
    }
})

router.delete('/follow', auth, async (req,res)=>{
    const dest = await User.findOne({where: {id:req.body.id}})
    if(!dest){
        res.status(400).send('can not follow user')
    }    
    try{
        await req.user.removeDestination(dest);
        const sourceFeed = getStreamClient().feed('timeline', req.user.id);
        // do we want to persist history?
        await sourceFeed.unfollow('user', dest.id, {keepHistory: false});
        res.send()
    }catch(e){
        res.status(400).send('can not follow user')
    }
})

router.get('/follow/following', auth, async (req,res) => {
    res.send(req.user.hasDestination())
})

module.exports = router