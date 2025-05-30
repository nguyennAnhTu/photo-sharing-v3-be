const express = require("express");
const router = express.Router();
const User = require("../db/userModel");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const md5 = require("md5");

router.post("/login", async(req, res) => {
    try {
        const loginInfo = req.body;
        console.log(loginInfo);
        const user = await User.findOne({username: loginInfo.username});
        if (!user) {
            return res.status(400).send({message: "Account with username " + loginInfo.username + " not exist"});
        } 
        else {
            if(md5(loginInfo.password) !== user.password) {
                return res.status(400).send();
            }
            const userObj = JSON.parse(JSON.stringify(user));
            res.cookie("user_id", userObj._id);
            res.status(200).json({
                _id: userObj._id,
                first_name: userObj.first_name,
                last_name: userObj.last_name
            })
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({e});
    }
})

router.post(
    "/register",
    async(req, res) => {
        try {
            const newInfo = req.body;
            console.log(newInfo);
            const existedUser = await User.findOne({username: newInfo.username});
            console.log(existedUser);
            if (existedUser) {
                return res.status(400).json({message: "username existed"});
            }
            newInfo.password = md5(newInfo.password);

            const newUser = new User(newInfo);
            await newUser.save();
            const userObj = JSON.parse(JSON.stringify(newUser));
            console.log(`login user: ${userObj.username}`);
            res.cookie("user_id", userObj._id);
            res.status(200).json(
            { 
                first_name: userObj.first_name, 
                last_name: userObj.last_name,
                _id: userObj._id 
            });
        } catch (e){
            console.log(e);
            res.status(500).json({message: e.message});
        }
    }
)

router.post(
    "/logout",
    (req, res, next) => auth.hasSessionRecord(req, res, next),
    async (request, response) => {
        response.clearCookie('user_id');
    request.session.destroy(err => {
        if(err) {
            console.log("Error in destroying the session");
            response.status(400).send();
        }
        else {
          response.status(200).send();
        }
    });
})

router.get(
    "/list",
    (req, res, next) => auth.hasSessionRecord(req,res,next), 
    async(request, response) => {
    try {
        const users = await User.find().select("_id first_name last_name occupation location");
        response.send(users);
    } catch(err) {
        response.status(500).send({err})
    }
})

router.get(
    "/:userId",
    (req, res, next) => auth.hasSessionRecord(req, res, next),
    async(request, response) => {
        try {
            const id = request.params.userId;
            const user = await User.findOne({_id: id});
            response.send(user);
        } catch(err) {
            response.status(500).send({err})
        }
    }
)

module.exports = router;