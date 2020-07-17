const User = require('../controllers/user');
//const upload = require('../controllers/upload');
const { wrapAsync } = require('../util/controllers');

module.exports = (api) => {
	api.route('/user/avatar').post(User.uploadAvatar);
    api.route('/user/avatar').get(wrapAsync(User.getAvatar));
    api.route('/user/me').get(wrapAsync(User.getUser));

};