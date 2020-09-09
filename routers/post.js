const Post = require('../models').Posts;
const User = require('../models').Users;
const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')
const {pushNotification} = require('../util/expo')

const express = require('express')
const router = new express.Router()

router.post('/posts/new', auth, async (req,res)=>{    
    try{        
        let ogImageUrl=null,ogSiteName=null,ogTitle=null,ogType=null,ogDescription=null;
        if( req.body.ogImageUrl && 
            req.body.ogSiteName && 
            req.body.ogTitle && 
            req.body.ogType &&
            req.body.ogDescription
        ){
            ogImageUrl = req.body.ogImageUrl;
            ogSiteName = req.body.ogSiteName;
            ogTitle = req.body.ogTitle;
            ogType = req.body.ogType;
            ogDescription = req.body.ogDescription;
        }
        else{
            console.log("repeating scrape operation")
            const og = await getStreamClient().og(req.body.url);
            if(og){
                ogImageUrl = og.images[0] ? og.images[0].image : null;
                ogSiteName = og.site_name ? og.site_name : null;
                ogTitle = og.title ? og.title : null;
                ogType = og.type ? og.type : null;
                ogDescription = og.description ? og.description : null;            
            }
        }

        const post = await Post.create({
            //assuming in case of repin, 
            //the repin post id will be sent from client
            description: req.body.description,
            url: req.body.url,
            repinnedFromId: req.body.repinnedFromId,
            repinnedFromPostId: req.body.repinnedFromPostId,
            ownerId: req.user.id,
            ogSiteName: ogSiteName,
            ogTitle: ogTitle,
            ogType: ogType,
            ogDescription: ogDescription,
            ogImageUrl: ogImageUrl
        });
        

        req.user.postCount = req.user.postCount + 1;
        req.user.save();

        const feed = getStreamClient().feed('user', req.user.id);
        await feed.addActivity({
            actor: post.ownerId,
            verb: 'post',
            object: post.id,
            foreign_id: `post:${post.id}`,
            time: post.createdAt
        });

        if(req.body.repinnedFromId && req.body.repinnedFromPostId){
            const repinnedFromPost = await Post.findOne({where: {id: req.body.repinnedFromPostId}});            
            repinnedFromPost.repinCount = repinnedFromPost.repinCount + 1;
            await repinnedFromPost.addUser(req.user)
            await repinnedFromPost.save()

            // send push notification for repins
            const source = await User.findOne({where: {id: req.body.repinnedFromId}})
            pushNotification(source.expoToken,`${req.user.username} cometed your post`, `Congrats, you’re sharing great stuff! Check out what others are sharing`,{avatarUrl: req.user.avatarUrl})
        }
        else{
            let followerList = await feed.followers();
            let id_list = followerList.results.map((item) => {
                const arr = item.feed_id.split(":");
                return parseInt(arr[1]);
            })
            
            const users = await User.findAll({where: {id: id_list}})
            let list = [];
            for(i in users){
                if(users[i].id === parseInt(req.body.id)){
                    continue;
                }
                pushNotification(users[i].expoToken,`${req.user.username} just cometed great content`, `Check it out now!`,{avatarUrl: req.user.avatarUrl})
            }
        }

        res.send(post)
    }catch(err){
        console.log(err)
        res.status(400).send('could not create post')
    }    
})

router.get('/posts/repinners', auth, async (req,res) => {
    try{
        const post = await Post.findOne({where: {id: req.query.id}});
        const repinners = await post.getUsers({ attributes: ['id','username', 'name', 'avatarUrl', 'work', 'SchoolId']})
        
        let list = [];
        for(i in repinners){
            const temp = repinners[i].serializeAuthenticatedUser();
            const val = await req.user.hasDestination(repinners[i]);
            list.push({...temp, doesFollow: val})
        }
        res.send(list)
    }catch(e){
        res.status(400).send('error')
    }
    
})

router.get('/posts/preview', auth, async (req,res) => {
    try{
        const og = await getStreamClient().og(req.query.url)
        if(og){
            res.send({
                ogSiteName: og.site_name,
                ogTitle: og.title,
                ogType: og.type,
                ogDescription: og.description,
                ogImageUrl: og.images[0] ? og.images[0].image : null,
                url: og.url ? og.url : req.query.url
            });
        }
        else    throw new Error("can't scrape");
    }catch(e){
        res.status(400).send('Could not fetch preview');
    }
    
})

router.get('/posts',auth, async (req,res) => {
    try{
        const post = await Post.findOne({
            where: {id: req.query.id},
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['username', 'name', 'id', 'avatarUrl']
                },
                {
                    model: User,
                    as: 'repinnedFrom',
                    attributes: ['username', 'id'] 
                }
            ]
        })
        res.send(post)        
    }catch(e){
        console.log(e)
        res.status(400).send('could not fetch post')
    }
})

router.delete('/posts',auth, async (req,res) => {
    const id = req.query.id
    try{
        const post = await Post.findOne({where: {id: id, ownerId: req.user.id}})
        
        if(post){
            if(post.repinnedFromPostId){
                const repinnedFromPost = await Post.findOne({where: {id: post.repinnedFromPostId}});
                let repinCount = repinnedFromPost.repinCount;
                repinCount = repinCount - 1;
                if(repinCount<0)    repinCount = 0;
                repinnedFromPost.repinCount = repinCount;
                await repinnedFromPost.save()
            }
            await getStreamClient().feed('user', post.ownerId).removeActivity({foreignId: `post:${post.id}`})
            await post.destroy()
            let count = req.user.postCount;
            count = count -1;
            if(count<0) count = 0;
            req.user.postCount = count;
            req.user.save()
            res.send()
        }
        else{
            throw 'post not found'
        }        
    }catch(e){
        console.log(e)
        res.status(400).send('could not delete post')
    }
})

module.exports = router