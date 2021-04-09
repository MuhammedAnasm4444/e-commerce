var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var db = require('../database/connection')
var collection = require('../database/collection')
var objectId  = require('mongodb').ObjectID
var rand = require('random-key');
require('dotenv').config();
// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.



  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser(async(id, done) => {
  var user =  await db.get().collection(collection.USER).findOne({_id:objectId(id)})
 
      done(null, user);
   
  });
passport.use(new GoogleStrategy({
    clientID:'6775234701-r2b5d9c9vqdjmpar5nhg5nfon5rcepo1.apps.googleusercontent.com',//process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET, //process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/google/auth"
  },
  async function(accessToken, refreshToken, profile, done) {
    console.log(profile)
    var coupons = [{"coupon":"WEL"+rand.generate(3),"couponType":"welcomeCoupon"},{"coupon":'REF'+rand.generate(3),"couponType":"referalCoupon"}]
    var referalId = rand.generate(4);
    var referalLinkId =  referalId;
    var referals = 0
    var user = await db.get().collection(collection.USER).findOne({googleId:profile.id})
    if(user) {
console.log('user exist')
done(null, user)
    }
    else {
      db.get().collection(collection.USER).insertOne({googleId:profile.id,name:profile.displayName,email:profile.emails[0].value,coupons:coupons, referalLinkId:referalLinkId, referals:referals}).then((user) => {
        console.log("user inserted in google")
       
        done(null, user.ops[0])
      })

    }


   
      
  }
));