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

const paramsToCreateBucket = {
  Bucket: 'totalnewone',
  CreateBucketConfiguration: {
      // Set your region here
      LocationConstraint: "ap-south-1"
  }
};





const createBucket = () =>{
  s3.createBucket(paramsToCreateBucket, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log('Bucket Created Successfully', data.Location);
});
}

 async function upload(req,folderName){
  console.log(__dirname,req)
  const semiTransparentRedPng = await sharp(req.data)
  .resize(200, 200, {
    fit: sharp.fit.inside,
    withoutEnlargement: true
  })
    .toBuffer();
  const uploadBulk = req.map((r)=>{
    const params = {
        Bucket: "turftown",
        Key: '/'+folderName+'/tt-'+Date.now()+'.png', // File name you want to save as in S3
        Body: r.data
      };
      return params
  })
  
 const y = await s3.upload(uploadBulk, async function(err, data) {
    if (err) console.log(err, err.stack);
    else {
      console.log('File Uploaded Successfully', data)
      return data
    };
});
const z = await y.promise()
return z
}


module.exports = upload;