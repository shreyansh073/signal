const ejs = require('ejs')
const fs = require('fs')
const sendgrid = require('@sendgrid/mail')

async function SendWelcomeEmail(data) {
	const msg = ejs.render(
		fs.readFileSync(__dirname + '/templates/welcome.ejs', 'utf8'),
		{
			username: data.username,
			name: data.name
		}
		);

	const obj = {
		to: data.email,
		from: process.env.SENDGRID_EMAIL,
		subject: `${data.name}, Welcome to Comet!`,
		html: msg,
	};

	let res = await SendEmail(obj);
	return res;
}

async function SendPasswordResetEmail(data) {
	const msg = ejs.render(
		fs.readFileSync(__dirname + '/templates/reset.ejs', 'utf8'),
		{
			otp: data.otp,
			username: data.username,
			name: data.name
		},
	);

	const obj = {
		to: data.email,
		from: process.env.SENDGRID_EMAIL,
		subject: `${data.name} reset your Comet password`,
		html: msg,
	};
	return await SendEmail(obj);
}

async function SendEmailVerificationEmail(data) {
	const msg = ejs.render(
		fs.readFileSync(__dirname + '/templates/verifyEmail.ejs', 'utf8'),
		{
			otp: data.otp,
			username: data.username,
			name: data.name
		},
	);

	const obj = {
		to: data.email,
		from: process.env.SENDGRID_EMAIL,
		subject: `${data.name} verify your email on Comet`,
		html: msg,
	};
	return await SendEmail(obj);
}

async function SendEmail(obj) {
	
    if (!process.env.SENDGRID_SECRET) {
        throw new Error('Could not send reset email, missing Sendgrid secret.');
    }
    sendgrid.setApiKey(process.env.SENDGRID_SECRET);
    let res = await sendgrid.send(obj);
    return res;
}

module.exports = {SendWelcomeEmail, SendPasswordResetEmail, SendEmailVerificationEmail, SendEmail };