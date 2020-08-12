require('dotenv').config()

const express = require('express')
const jwt = require('express-jwt')
const models = require('./models');

const path = require('path');

const { adminRouter, rootPath } = require('./admin');
const userRouter = require('./routers/user')
const authRouter = require('./routers/auth')
const postRouter = require('./routers/post')
const followRouter = require('./routers/follow')
const feedRouter = require('./routers/feed')

const api = express()

const port = process.env.PORT

api.use(express.json())

// USE ADMIN-PANEL
api.use(rootPath, adminRouter)

api.use(authRouter)
api.use(userRouter)
api.use(postRouter)
api.use(feedRouter)
api.use(followRouter)

models.sequelize.sync({force: false}).then(function(){
	api.listen(port, () => {
		console.log('Server is up on port ' + port)
	})
});
