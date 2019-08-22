const aws = require('aws-sdk')
const fs = require('fs');
const path = require('path');

aws.config.update({
    secretAccessKey: "9SkVgIrzjl+PoiOZ5AVMDSHxkQzuS+qt4gYG8BS+",
    accessKeyId: "AKIAJCWCKO7WP7A6PPYQ",
    region: "ap-south-1"
})

const s3 = new aws.S3()

const upload = (filename,folder,message,res) =>{
    var filePath = "./assets/"+filename;
    console.log('test')
    //configuring parameters
    var params = {
    Bucket: 'turftown',
    Body : fs.createReadStream(filePath),
    Key : folder+"/"+Date.now()+"_"+path.basename(filePath)
    };
    console.log('test')
    s3.upload(params, function (err, data) {
        //handle error
        if (err) {
          res.send({status:"failed", message: "failded to upload image to s3"})
        }
        console.log('test')
        //success
        if (data) {
            res.send({status:"success", message, imageurl:data.Location})
        }
      });
}


module.exports = upload;