const Post = require('../models').Post;

const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')

const express = require('express')
const router = new express.Router()

/* TODO
    like post
    repin post
*/

router.post('/posts/new', auth, async (req,res)=>{
    try{
        const post = await Post.create({
            //assuming in case of repin, 
            //the repin post id will be sent from client
            ...req.body, 
            ownerId: req.user.id
        });

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

router.get('/posts/:id',auth, async (req,res) => {
    console.log(req.query)
    const id = req.query.id
    try{
        const post = await Post.findOne({where: {id: id, ownerId: req.user.id}})
        res.send(post)        
    }catch(e){
        console.log(e)
        res.status(400).send('could not delete post')
    }
})

router.delete('/posts/:id',auth, async (req,res) => {
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