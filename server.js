require('dotenv').config()

const express = require('express');
const api = express();
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://900c83d75d5e4e1a8c34a7f253b7b68e@o433402.ingest.sentry.io/5388403' });
api.use(Sentry.Handlers.requestHandler());

const jwt = require('express-jwt')
const models = require('./models');
const path = require('path');

const { adminRouter, rootPath } = require('./admin');
const userRouter = require('./routers/user')
const authRouter = require('./routers/auth')
const postRouter = require('./routers/post')
const followRouter = require('./routers/follow')
const feedRouter = require('./routers/feed')



const port = process.env.PORT

api.use(express.json())

// USE ADMIN-PANEL
api.use(rootPath, adminRouter)

api.use(authRouter)
api.use(userRouter)
api.use(postRouter)
api.use(feedRouter)
api.use(followRouter)
api.get('/debug-sentry', function mainHandler(req, res) {
	throw new Error('My first Sentry error!');
  });
api.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
api.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

models.sequelize.sync({force: true}).then(function(){
	api.listen(port, () => {
		console.log('Server is up on port ' + port)
	})
});
