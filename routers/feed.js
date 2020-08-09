const Post = require('../models').Post;
const auth = require('../middleware/auth')
const {getStreamClient} = require('../util/stream')

const express = require('express')
const router = new express.Router()

router.get('/feed/home-feed', auth, async (req,res) =>{
    const limit = req.query.per_page || 30;
    const offset = req.query.page * limit || 0;
    
    try{
        const response = await getStreamClient().feed('user', req.query.userId).get({limit,offset})
        console.log(response)

        let postIDs = response.results.map((r) => {
            return parseInt(r.foreign_id.split(':')[1]);
        });

        let posts = await Post.findAll({
            where: {id: postIDs},
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['username', 'name', 'id', 'avatarUrl']
                },
                {
                    model: User,
                    as: 'repinnedFrom',
                    attributes: ['username'] 
                }
            ]
        });
        console.log(posts)
        let postLookup = {};

        for (let p of posts) {
            postLookup[p.id] = p;
        }

        let sortedposts = [];

        for (let r of response.results) {
            let postID = r.foreign_id.split(':')[1];
            let post = postLookup[postID];

            if (!post) {
                // log errors later on
                continue;
            }

            sortedposts.push(post);
        }
        res.json(sortedposts);
        }catch(e){
            console.log(e)
            res.status(400).send('could not fetch feed')
        }
    
})

router.get('/feed/profile-feed', auth, async (req,res) => {
    const limit = req.query.per_page || 30;
    const offset = req.query.page * limit || 0;

    try{
        const posts = await Post.findAll({
            where: {ownerId: req.query.id},
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });    
        res.send(posts);
    }catch(e){
        res.status(400).send('could not fetch posts')
    }    
});

module.exports = router