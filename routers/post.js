const Post = require('../models').Post;
const User = require('../models').User;
const ogs = require('open-graph-scraper');
const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')

const express = require('express')
const router = new express.Router()

/* TODO
    repin post
*/

router.post('/posts/new', auth, async (req,res)=>{
    const ogtemp = await ogs({url: req.body.url});
    const og = ogtemp.result;
    try{

        const post = await Post.create({
            //assuming in case of repin, 
            //the repin post id will be sent from client
            ...req.body, 
            ownerId: req.user.id,
            ogSiteName: og.ogSiteName,
            ogTitle: og.ogTitle,
            ogType: og.ogType,
            ogDescription: og.ogDescription,
            ogImageUrl: og.ogImage[0] ? og.ogImage[0].url : og.ogImage.url
        });

        req.user.postCount = req.user.postCount + 1;
        req.user.save();

        // const feed = getStreamClient().feed('user', post.ownerId);
        // await feed.addActivity({
        //     actor: post.ownerId,
        //     verb: 'post',
        //     object: post.id,
        //     foreign_id: `post:${post.id}`,
        //     time: post.createdAt
        // });

        res.send(post)
    }catch(err){
        console.log(err)
        res.status(400).send('could not create post')
    }    
})

router.get('/posts/preview', auth, async (req,res) => {
    try{
        const og = await ogs({url: req.query.url});
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
            include: {
                model: User,
                as: 'owner',
                attributes: ['username', 'name', 'id' ]
            }
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
            //await getStreamClient().feed('user', post.ownerId).removeActivity({foreignId: `post:${post.id}`})
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