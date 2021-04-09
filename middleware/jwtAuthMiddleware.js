const objectId = require('mongodb').ObjectID
const jwt = require('jsonwebtoken');
const adminHelpers = require("../helpers/admin-helpers");
require('dotenv').config();
module.exports = {
checkUser : (req, res, next) => {
    console.log(req.cookies)
    const token = req.cookies.jwt
    if (token) {
        jwt.verify(token,process.env.SECRET, async(err, decodedToken)=>{
                if(err){
                    console.log(err.message)
                    res.locals.user = null;
                    res.redirect('/login')
                    next();
                }
                else{
                    console.log(decodedToken)
                    let user = await adminHelpers.login({_id:decodedToken.id})
                    console.log(user)
                    next();
                }
            })
        }
        else{
            res.locals.user = null;
            next()
        }

    },

 requireAuth :(req, res, next) => {
    console.log(req.cookies.jwt)
    const token = req.cookies.jwt
    // check json web token
    if(token) {
     jwt.verify(token,process.env.SECRET, (err, decodedToken)=>{
         if(err) {
             console.log(err.message)
             res.redirect('/admin/login')
         }
         else next();
     })
    }
    else res.redirect('/admin/login');
},
checkAdmin : (req, res, next) => {
    const token = req.cookies.jwt;
    if(token) {
        res.redirect('/')
    }
    else next();
},
}