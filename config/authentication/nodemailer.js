const nodemailer = require("nodemailer");

function sendEmail(email, message){
    var transporter = nodemailer.createTransport({
      service:'gmail',
      auth:{
        user:'anchukhan9@gmail.com',
        pass:'ummauppa'
      }
    });
    
    var mailOptions = {
      from :'anchukhan9@gmail.com',
      to:email,
      subject:'Vendorship Approval',
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