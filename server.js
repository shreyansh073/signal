require('dotenv').config()

const express = require('express')
const jwt = require('express-jwt')
const models = require('./models');
const fs = require('fs')
const path = require('path');



const api = express()
const port = process.env.PORT

api.use(express.json())

api.use(
	jwt({ secret: process.env.JWT_SECRET , algorithms: ['HS256'] }).unless({
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

fs.readdirSync(path.join(__dirname, 'routes')).map((file) => {
	require('./routes/' + file)(api);
});

(async () => {
	await models.sequelize.sync({ force: true });

	// Code here
  })();


api.listen(port, () => {
    console.log('Server is up on port ' + port)
})

