const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const db = require('../database/connection');
const collection = require('../database/collection')
const objectId = require('mongodb').ObjectID
const accountSid = 'ACc9aa38dbd1436db80c50c564caa66018';
const authToken = '85f7c08ebe4866a0e661fe212fe50b64';
const serviceid = 'VA5ab0e4a18c0ac22488902b5184ed33f0';
const client = require('twilio')(accountSid, authToken);
// client.verify.services(serviceid).verificationChecks.create({to: '+918590462197', code:'sms'}).then(() =>{

// })
// client.verify.services(serviceid).verifications.create({to: '+918590462197', channel:'sms'})
// .then((data) => {
//     console.log('hello')
// })
module.exports = function (passport, getUserByNumber, getUserById) {
  passport.use (
    new LocalStrategy({ usernameField: 'phone'}, async(email, password, done) => {
      // Match User
      console.log('email')
      var user = await getUserByNumber(email)
      console.log(user)
      if (!user) {
        console.log("user not found")
        return done(null, false, { message: 'That email is not registered'})
      }
      // Match Password
      client.verify.services(serviceid).verificationChecks.create({to: '+91'+email, code:password})
.then((data) => {
  console.log(data)
  if (data.status === "approved") {
    console.log("otp verified")
    return done(null, user);
}
 else {
  
     console.log("incorrect otp")
     return done(null, false, {message:' password correct'})

 }
})
      // bcrypt.compare(password, user.password, (err, isMatch) => {
      //   if(err) throw err
      //   if(isMatch) {
      //     console.log("user matched")
      //     return done(null, user);
      //   } else {
      //     console.log(password)
      //      console.log(user.password)
      //     console.log("password Incorrect")
      //     return done(null, false, {message:' password correct'})
      //   }

    

      // });

    })
  )
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser(async(id, done) => {
  var user =  await getUserById(id)
 
      done(null, user);
   
  });
}


// module.exports = function (passport, getUserByEmail, getUserById) {
//   passport.use (
//     new LocalStrategy({ usernameField: 'email'}, async(email, password, done) => {
//       // Match User
//       var user = await getUserByEmail(email)
//       console.log(user)
//       if (!user) {
//         console.log("user not found")
//         return done(null, false, { message: 'That email is not registered'})
//       }
//       // Match Password
//       bcrypt.compare(password, user.password, (err, isMatch) => {
//         if(err) throw err
//         if(isMatch) {
//           console.log("user matched")
//           return done(null, user);
//         } else {
//           console.log(password)
//            console.log(user.password)
//           console.log("password Incorrect")
//           return done(null, false, {message:' password correct'})
//         }

    

//       });

//     })
//   )
//   passport.serializeUser((user, done) => {
//     done(null, user._id);
//   });
  
//   passport.deserializeUser(async(id, done) => {
//   var user =  await getUserById(id)
 
//       done(null, user);
   
//   });
// }
