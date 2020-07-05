const express = require('express')
const authRouter = require('./routers/auth')
const userRouter = require('./routers/user')
const jwt = require('express-jwt')
require('./util/db')

const api = express()
const port = process.env.PORT || 3000

api.use(express.json())

api.use(
	jwt({ secret: 'bits', algorithms: ['HS256'] }).unless({
		path: [
			'/',
			'/auth/signup',
			'/auth/login',
			'/auth/forgot',
			'/auth/reset',
		],
	}),
);

api.use(function catchAuthErrors(err, req, res, next) {
	if (err.name === 'UnauthorizedError') {
		res.status(401).send('Missing authentication credentials.');
	}
});

api.use(authRouter);
api.use(userRouter)

api.listen(port, () => {
    console.log('Server is up on port ' + port)
})