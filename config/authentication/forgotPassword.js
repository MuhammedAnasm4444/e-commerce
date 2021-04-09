const nodemailer = require("nodemailer");

function sendEmail(email, message){
    var transporter = nodemailer.createTransport({
      service:'gmail',
      auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD 
      }
    });
    
    var mailOptions = {
      from :process.env.EMAIL,
      to:email,
      subject:'Forgot Password',
      text:message
    };
    transporter.sendMail(mailOptions,function(error , info){
      if(error){
        console.log(error)
      }
      else{
        console.log("Email sent:"+info.response)
        console.log(info)
      }
    })
    
    }
 module.exports = sendEmail;