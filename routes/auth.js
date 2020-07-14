const Auth = require('../controllers/auth');
const { wrapAsync } = require('../util/controllers');

module.exports = (api) => {
	api.route('/auth/signup').post(wrapAsync(Auth.signup));
	api.route('/auth/login').post(wrapAsync(Auth.login));
	api.route('/auth/forgot-password').post(wrapAsync(Auth.forgotPassword));
	api.route('/auth/reset-password').post(wrapAsync(Auth.resetPassword));
};