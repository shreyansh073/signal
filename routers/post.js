const Post = require('../models').Posts;
const User = require('../models').Users;
const ogs = require('open-graph-scraper');
const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')

const express = require('express')
const router = new express.Router()

router.post('/posts/new', auth, async (req,res)=>{
    // try{
    //     const ogtemp = await ogs({options });
    //     og = ogtemp.result;
    // }catch(e){
    //     og = null;
    // }
    
    try{
        let og = await ogs({
            url: req.body.url, 
            retry: 5, 
            followRedirect: true, 
            maxRedirects: 20,
            timeout: 10000
        });
        og = og.result;
        
        if(req.body.repinnedFromId && req.body.repinnedFromPostId){
            const repinnedFromPost = await Post.findOne({where: {id: req.body.repinnedFromPostId}});            repinnedFromPost.repinCount = repinnedFromPost.repinCount + 1;
            await repinnedFromPost.addUser(req.user)
            await repinnedFromPost.save()
        }
        let ogImageUrl,ogSiteName,ogTitle,ogType,ogDescription;
        if(og){
            if(og.ogImage){
                ogImageUrl = og.ogImage[0] ? og.ogImage[0].url : og.ogImage.url;
            }else{
                ogImageUrl = null;
            }
            ogSiteName = og.ogSiteName ? og.ogSiteName : null;
            ogTitle = og.ogTitle ? og.ogTitle : null;
            ogType = og.ogType ? og.ogType : null;
            ogDescription = og.ogDescription ? og.ogDescription : null;            
        }else{
            ogImageUrl = null;
            ogType = null;
            ogTitle = null;
            ogDescription = null;
            ogSiteName = null;
        }
        const post = await Post.create({
            //assuming in case of repin, 
            //the repin post id will be sent from client
            description: req.body.description,
            url: req.body.url,
            repinnedFromId: req.body.repinnedFromId, 
            ownerId: req.user.id,
            ogSiteName: ogSiteName,
            ogTitle: ogTitle,
            ogType: ogType,
            ogDescription: ogDescription,
            ogImageUrl: ogImageUrl
        });
        

        req.user.postCount = req.user.postCount + 1;
        req.user.save();

        const feed = getStreamClient().feed('user', post.ownerId);
        await feed.addActivity({
            actor: post.ownerId,
            verb: 'post',
            object: post.id,
            foreign_id: `post:${post.id}`,
            time: post.createdAt
        });

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
        res.send(repinners)
    }catch(e){
        res.status(400).send('error')
    }
    
})

router.get('/posts/preview', auth, async (req,res) => {
    try{
        const og = await ogs({
            url: req.query.url, 
            retry: 5, 
            followRedirect: true, 
            maxRedirects: 20,
            timeout: 10000
        });
        res.send({
            status: !og.error,
            og: og.result
        });
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
            await getStreamClient().feed('user', post.ownerId).removeActivity({foreignId: `post:${post.id}`})
            await post.destroy()
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