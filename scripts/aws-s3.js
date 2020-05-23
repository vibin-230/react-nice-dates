const aws = require('aws-sdk')
const fs = require('fs');
const path = require('path');
// Enter copied or downloaded access ID and secret key here
const ID = '';
const SECRET = '';

// The name of the bucket that you have created
const BUCKET_NAME = 'test-bucket';


const s3 = new aws.S3({
  secretAccessKey: "avHeiNwn0HtgdCBsazJ6I2NK8xFQOD7NXzV3yt5T",
  accessKeyId: "AKIAIYDNYTYVGSDGQ2QA",
  region: "ap-south-1"
})

const params = {
  Bucket: 'totalnewone',
  CreateBucketConfiguration: {
      // Set your region here
      LocationConstraint: "ap-south-1"
  }
};

const upload = () =>{
  s3.createBucket(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log('Bucket Created Successfully', data.Location);
});
}


module.exports = upload;