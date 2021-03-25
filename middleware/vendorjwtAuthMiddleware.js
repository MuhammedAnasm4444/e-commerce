const vendorHelpers = require('../helpers/vendor-helpers');
const objectId = require('mongodb').ObjectID
const jwt = require('jsonwebtoken');
const db = require('../config/database/connection');
const collection = require('../config/database/collection');

module.exports = {
     checkUser : (req, res, next) => {
        const token = req.cookies.vendorjwt
        if (token) {
            jwt.verify(token,'my secret', async(err, decodedToken)=>{
                    if(err){
                        res.locals.vendor = null;
                        res.redirect('/login')
                        next();
                    }
                    else{
                        console.log(decodedToken)
                        let vendor = await vendorHelpers.find({_id:objectId(decodedToken.id), $or:[{status:'unblocked'},{status:{$exists:false}}]})
                        if(!vendor) {
                            console.log("vendor blocked")
                            res.cookie('vendorjwt', '', {maxAge:1})
                            console.log(req.cookies.vendorjwt)
                            res.redirect('/vendor/login')
                            
                            
                        }
                        else {
                            console.log("vendor Active")
                            res.locals.vendor = vendor
                            req.vendor = vendor
                            next();
                        }
                        
                        
                    }
                })
            }
            else{
                res.locals.vendor = null;
                next()
            }
    
        },
     requireAuth : (req, res, next) => {
          console.log('helllooooooooooooooo')
        console.log(req.cookies.vendorjwt)
        const token = req.cookies.vendorjwt
        // check json web token
        if(token) {
         jwt.verify(token,'my secret', (err, decodedToken)=>{
             if(err) {
                 console.log(err.message)
                 res.redirect('/vendor/login')
             }
             else next();
         })
        }
        else res.redirect('/vendor/login');
    },
    checkVendor :(req, res, next) => {
        
        const token = req.cookies.vendorjwt;
        if(token) {
            console.log('loginnnnnnn')
            res.redirect('/')
        }
        else next();
    }
}