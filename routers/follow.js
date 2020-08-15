const User = require('../models').User;
const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')
const { Op } = require("sequelize");
const express = require('express')
const router = new express.Router()

router.post('/follow', auth, async (req,res)=>{
    if(req.user.id === req.body.id){
        return res.status(402).send('cannot follow yourself')
    }
    const dest = await User.findOne({where: {id:req.body.id}})
    if(!dest){
        res.status(400).send('can not follow user')
    }    
    try{
        if(await req.user.hasDestination(dest)){
            return res.status(402).send('already follows user')
        }
        await req.user.addDestination(dest);

        const sourceFeed = getStreamClient().feed('timeline', req.user.id);
        await sourceFeed.follow('user', dest.id, {limit: 20});

        req.user.followingCount = req.user.followingCount + 1;
        await req.user.save();

        dest.followerCount = dest.followerCount + 1;
        await dest.save();

        res.send()
    }catch(e){
        res.status(400).send('can not follow user')
    }
})

router.post('/follow/many', auth, async (req,res)=>{    
    try{
        const dest_users = await User.findAll({where: {id: req.body.id_list}})
        const count = dest_users.length;
        if(count === 0){
            res.status(400).send('invalid ids')
        }
        
        await req.user.addDestination(dest_users);

        let follows = [];
        dest_users.map((dest) => {
            follows.push({
                'source': `timeline:${req.user.id}`,
                'target': `user:${dest.id}`,
                'activity_copy_limit': 20
            })
        })

        const client = getStreamClient();
        await client.followMany(follows);

        req.user.followingCount = req.user.followingCount + count;
        req.user.isOnboardingComplete = true;
        await req.user.save();
        
        dest_users.map(async (dest) => {
            dest.followerCount = dest.followerCount + 1;
            await dest.save();
        })        

        res.send()
    }catch(e){
        console.log(e)
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
        await sourceFeed.unfollow('user', dest.id, {keepHistory: false});
        req.user.followingCount = req.user.followingCount - 1;
        dest.followerCount = dest.followerCount - 1;
        await req.user.save();
        await dest.save();
        res.send()

    }catch(e){
        res.status(400).send('can not follow user')
    }
})

router.get('/follow/does-follow', auth, async (req,res) => {
    try{
        const dest = await User.findOne({where: {id:req.query.id}})
        const status = await req.user.hasDestination(dest)
        res.send(status)
    }catch(e){
        res.status(400).send('error')
    }
})

router.get('/follow/following-list', auth, async (req,res) => {
    try{
        const user = await User.findOne({where: {id: req.query.id}})
        const followingList = await user.getDestination({attributes: ['id','name', 'username', 'avatarUrl', 'work', 'school']})
        let list = [];
        for(i in followingList){
            const temp = followingList[i].serializeAuthenticatedUser();
            const val = await req.user.hasDestination(followingList[i]);
            list.push({...temp, doesFollow: val})
        }
        res.send(list)
    }catch(e){
        console.log(e)
        res.status(400).send('error')
    }
})

router.get('/follow/follower-list', auth, async (req,res) => {
    try{
        const userFeed = getStreamClient().feed('user', req.query.id);
        let followerList = await userFeed.followers();
        let id_list = followerList.results.map((item) => {
            const arr = item.feed_id.split(":");
            return parseInt(arr[1]);
        })
        
        const users = await User.findAll({where: {id: id_list}})
        let list = [];
        for(i in users){
            const temp = users[i].serializeAuthenticatedUser();
            const val = await req.user.hasDestination(users[i]);
            list.push({...temp, doesFollow: val})
        }
        res.send(list)
    }catch(e){
        console.log(e)
        res.status(400).send('error')
    }
})



router.get('/follow/recommend', auth, async (req,res) => {
    try{
        const followingList = await req.user.getDestination({attributes: ['id']})
        let list = followingList.map((item) => item.id)
        list.push(req.user.id)
        console.log(list)
        const recommended = await User.findAll({
            where: {
                id: {
                    [Op.notIn]: list
                }
            },
            order: [
                ['followerCount', 'DESC'],
                ['postCount', 'DESC']
            ],
            attributes: ['id','name','username','avatarUrl', 'work','school']
        })
        res.send(recommended)
    }catch(e){
        console.log(e);
        res.status(400).send('cant recommend')
    }
    
})

module.exports = router