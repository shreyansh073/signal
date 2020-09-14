const Post = require('../models').Posts;
const User = require('../models').Users;
const Rating = require('../models').Ratings;
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
                ogImageUrl = og.images ? (og.images[0] ? og.images[0].image : null) : null;
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
            pushNotification(source.expoToken,`${req.user.username} cometed your post`, `Congrats, you’re sharing great stuff! Check out what others are sharing`)
        }
        
        let followerList = await feed.followers({limit: 1000, offset: 0 });
        let id_list = followerList.results.map((item) => {
            const arr = item.feed_id.split(":");
            return parseInt(arr[1]);
        })
        
        const users = await User.findAll({where: {id: id_list}})
        let list = [];
        for(i in users){
            if(parseInt(users[i].id) === parseInt(req.user.id)){
                continue;
            }
            if(req.body.repinnedFromId && parseInt(users[i].id) === parseInt(req.body.repinnedFromId)){
                continue;
            }
            list.push(users[i].id)
            pushNotification(users[i].expoToken,`${req.user.username} just cometed great content`, `Check it out now!`)
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
                ogSiteName: og.site_name ? og.site_name : null,
                ogTitle: og.title ? og.title : null,
                ogType: og.type ? og.type : null,
                ogDescription: og.description ? og.description : null,
                ogImageUrl: og.images ? (og.images[0] ? og.images[0].image : null) : null,
                url: req.query.url
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

router.post('/posts/rating', auth, async (req,res) => {
    
    const post = await Post.findOne({where: {id: req.body.post_id}})
    if(!post){
        return res.status(400).send("post does not exist")
    }
   
    let rating = await Rating.findOne({where: {UserId: req.user.id, PostId: req.body.post_id}})
    let avg;
    if(rating){
        console.log(post.avgRating)
        console.log(rating.rating)
        avg = ((post.avgRating * post.ratingCount) - rating.rating + req.body.rating)/post.ratingCount;
        post.avgRating = avg.toFixed(2);
        await post.save();
        rating.rating = req.body.rating;
        await rating.save();
        
    }
    else{
        rating = await Rating.create({
            PostId: req.body.post_id,
            UserId: req.user.id,
            rating: req.body.rating
        })
        avg = post.avgRating;
        if(avg){
            avg = (avg * post.ratingCount + rating.rating)/(post.ratingCount+1);
        }
        else{
            avg = rating.rating;
        }
        post.ratingCount = post.ratingCount + 1;
        post.avgRating = avg.toFixed(2);
        await post.save()
    }
    console.log(avg)
    res.send(rating)
})

router.delete('/posts/rating', auth, async (req,res) => {
    const post = await Post.findOne({where: {id: req.body.post_id}})
    if(!post){
        return res.status(400).send("post does not exist")
    }
    
    const rating = await Rating.findOne({where: {UserId: req.user.id, PostId: req.body.post_id}})
    if(!rating){
        return res.status(400).send("rating does not exist")
    }

    let avg = post.avgRating;
    if(avg && avg > 0){
        avg = ((avg * post.ratingCount) - rating.rating)/(post.ratingCount -1);
        avg = avg > 0 ? avg : null;
    }
    post.avgRating = avg;
    post.ratingCount = post.ratingCount -1;
    await post.save()
    await rating.destroy()
    res.send()
})

router.get('/posts/rating_list', auth, async (req,res) => {
    const rating_list = await Rating.findAll({
        where: {
            PostId: req.query.id
        },
        attributes: ['rating','review'],
        include: {
            model: User,
            attributes: ['id','username', 'name', 'SchoolId', 'avatarUrl']
        }
    })
    res.send(rating_list)
})
module.exports = router