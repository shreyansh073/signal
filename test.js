require('dotenv').config()
const AWS = require('aws-sdk');

const aws_accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const aws_secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
console.log(process.env.AWS_ACCESS_KEY_ID);
console.log(process.env.AWS_SECRET_ACCESS_KEY)
const s3 = new AWS.S3({
    accessKeyId: aws_accessKeyId,
    secretAccessKey: aws_secretAccessKey,
    region: "us-east-2"
});
var params = {
    Bucket: 'cometclub' /* required */
  };
  s3.waitFor('bucketExists', params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });