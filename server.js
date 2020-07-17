require('dotenv').config()

const express = require('express')
const jwt = require('express-jwt')
const models = require('./models');

const path = require('path');

const userRouter = require('./routers/user')
const authRouter = require('./routers/auth')

const api = express()

const port = process.env.PORT

api.use(express.json())

api.use(authRouter)
api.use(userRouter)

models.sequelize.sync().then(function(){
	api.listen(port, () => {
		console.log('Server is up on port ' + port)
	})
});
