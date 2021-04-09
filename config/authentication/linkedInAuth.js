var passport = require("passport");
var LinkedIntrategy = require("passport-linkedin-oauth2").OAuth2Strategy;
var db = require("../database/connection");
var collection = require("../database/collection");
var objectId = require("mongodb").ObjectID;
var LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
var rand = require("random-key");
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  console.log(id);
  var user = await db
    .get()
    .collection(collection.USER)
    .findOne({ _id: objectId(id) });

  done(null, user);
});
passport.use(
  new LinkedInStrategy(
    {
      clientID:'86cy4lpsrvcw9x',//process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,//process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "/auth/linkedIn",
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile);
      // asynchronous verification, for effect...
      process.nextTick(async function () {
        var coupons = [
          { coupon: "WEL" + rand.generate(3), couponType: "welcomeCoupon" },
          { coupon: "REF" + rand.generate(3), couponType: "referalCoupon" },
        ];
        var referalId = rand.generate(4);
        var referalLinkId = referalId;
        var referals = 0;
        // To keep the example simple, the user's LinkedIn profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the LinkedIn account with a user record in your database,
        // and return that user instead.
        var user = await db
          .get()
          .collection(collection.USER)
          .findOne({ linkedInId: profile.id });
        if (user) {
          console.log("user exist");
          done(null, user);
        } else {
          db.get()
            .collection(collection.USER)
            .insertOne({
              linkedInId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              coupons: coupons,
              referalLinkId: referalLinkId,
              referals: referals,
            })
            .then((user) => {
              console.log("user inserted in google");

              done(null, user.ops[0]);
            });
        }
      });
    }
  )
);
