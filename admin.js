const AdminBro = require('admin-bro');
const AdminBroExpressjs = require('admin-bro-expressjs');
const AdminBroSequelize = require('admin-bro-sequelizejs')

AdminBro.registerAdapter(AdminBroSequelize);

const db = require('./models');
const adminBro = new AdminBro({
  databases: [db],
  rootPath: '/admin',
  branding: {
    companyName: 'Comet',
    //logo: ''
}
});

const router = AdminBroExpressjs.buildAuthenticatedRouter(adminBro, {
    authenticate: (email, password) => {
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            return {email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD};
        } else {
            return null;
        }
    },
    cookiePassword: process.env.ADMIN_COOKIE_PASSWORD
})

module.exports = {
    adminRouter: router,
    rootPath: adminBro.options.rootPath
}