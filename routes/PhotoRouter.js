const express = require("express");
const router = express.Router();
const Photo = require("../db/photoModel");
const mongoose = require("mongoose");
const User = require("../db/userModel");
const auth = require("../middleware/auth");
const uploadCloud = require("../middleware/uploadCloud");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.post(
  "/new",
  (req, res, next) => auth.hasSessionRecord(req, res, next),
  upload.single('photo'),
  (req, res, next) => uploadCloud.upload(req, res, next),
  async(request, response) => {
    try {
      console.log(request.body);
      const newPhoto = new Photo({
        file_name: request.body.photo,
        user_id: request.cookies.user_id,      
      });
      await newPhoto.save();
      response.status(200).send();
    } catch(error) {
      response.status(500).send({message: error.message});
    }
  }
)

router.post(
    "/commentsOfPhoto/:photoId",
    (req, res, next) => auth.hasSessionRecord(req, res, next),
    async(request, response) => {
        try {
            const photoId = request.params.photoId;
            const commentBody = request.body;
            if (!commentBody.comment) {
                return response.status(400).json({message: "comment must not empty"});
            }
            const photo = await Photo.findOne({_id: photoId, is_deleted: false});
            if (photo) {
                const comment = {
                    comment: commentBody.comment,
                    date_time: new Date().toISOString(),
                    user_id: request.cookies.user_id,
                }
                if (!photo.comments) photo.comments = [comment];
                else photo.comments.push(comment);
                await photo.save();
                console.log(`saved comment for photo "${photoId}" `);
                response.status(200).send({comment: commentBody.comment});
            }
        } catch(error){
            console.log(error);
            response.status(500).send({message: error.message});
        }
    }
)

router.get(
  "/photosOfUser/:userId", 
  (req, res, next) => auth.hasSessionRecord(req,res,next),
  async (request, response) => {
    try {
      const id = request.params.userId;
      const photosData = await Photo.find({ user_id: id, is_deleted: false });
      const photos = JSON.parse(JSON.stringify(photosData))
      for(const photo of photos) {
        if(photo.comments.length > 0){
          for (const cmt of photo.comments) {
            const user = await User.findOne({_id: cmt.user_id})
            cmt.user = user
          }
          
        }
      }
      response.send(photos);
    } catch (error) {
      response.status(500).send({ error: error.message });
    }
});

module.exports = router;