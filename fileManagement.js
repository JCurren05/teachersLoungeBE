import AWS from 'aws-sdk';
import multer from "multer";

//Initialize s3 info
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  });


//Functions for managing files

//Function to upload to s3
const s3Upload = (req,res)=>{   
    const file = req.file;
    const bucket = process.env.S3_BUCKET
    const fileLoc = "uploads/"+Date.now()+file.originalname.split(' ').join('_')
    const params = {
      Bucket: bucket,        
      Body: file.buffer,
      Key: fileLoc
    };   
    s3.upload(params, function(err, data) {
      if (err) {
          throw err;
      }
      res.status(200).send({message:'Image uploaded succesfully',bucket: bucket, file:fileLoc})
      //console.log("File uploaded (log from server) "+bucket+"/"+fileLoc);
    });
         
  }

const s3Delete = (req,res,next)=>{
  var regEx= new RegExp("uploads/(.*)")
  var fileID = regEx.exec(req.body.fileID);
  if(fileID != null){
    var fileUrl = fileID[0];
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: fileUrl
    }; 
    s3.deleteObject(params,function(err,data){
      if (err) {
        throw err;
    }
    return res.status(200).send({message:'File and post deleted succesfully'})
    })  
  }else{    
    return res.status(200).send({message:'Post deleted succesfully'})
  }
    
    
}
  

  //Function that parses file from http request body
  const fileHelper = multer({
    limits:{fieldSize: 25 * 1024 * 1024},
    fileFilter(req, file, cb) {      
        cb(undefined, true)
    }
  });

export {fileHelper, s3Upload, s3Delete};