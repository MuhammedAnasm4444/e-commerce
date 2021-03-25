const jwt = require('jsonwebtoken');
var objectId = require('mongodb').ObjectID
var sendEmail = require('../config/authentication/nodemailer');
const adminHelpers = require("../helpers/admin-helpers")
const maxAge = 3 * 34 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({id}, 'my secret', {
        expiresIn:maxAge
    })
}
module.exports = {
    route:(req, res) => {
        adminHelpers.getDashboardDetails().then((stats) => {
            res.render('admin/dashboard', { user:"anas", stats })
        })
        
    },
    login_get:(req, res) => {
        res.render('admin/login', { layout:false })
    },
    login_post:async(req, res) => {
        console.log(req.body)
    
        try {
            const Login = await adminHelpers.login(req.body)
            if (Login.user) {
                
                var user  = Login.user
                const token = createToken(user._id)
                res.cookie('jwt', token, {httpOnly:true, maxAge:maxAge *1000})
               
                res.json({status:true})
    
            }
            else if (Login.passwordErr) {
                res.json({passwordErr:true})
            }
            else {
                res.json({loginErr:true})
            }
        }
        catch (err) {
            console.log(err)
             
             res.redirect('/')
    
        }
    },
    logout_get:(req, res) => {
        res.cookie('jwt', '', {maxAge:1})
        res.redirect('/admin');
    },
    vendor_get: (req, res) => {
        var collection = {vendor:true}
        adminHelpers.find(collection).then((vendors) => {
    console.log(vendors)
            res.render("admin/vendor", {vendors})
        })
    },
    add_vendor_get:(req, res) => {
        res.render('admin/add-vendor')
     },

     add_vendor_post:async(req, res) => {
        var password = '1234'
      req.body.password = password
      console.log(req.body)
      var Message  = `Login with your respect Email and Password`+` 
                  Password---->`+req.body.password +`   
                  ******** Do not Share ********`
      try{
          var sendMail = await sendEmail(req.body.email, Message)
          adminHelpers.addVendor(req.body).then((response)=>{
              console.log(response)
              res.json(true)
          })
      }
      catch (err) {
          console.log(err)
      }
      },
      vendor_page_get:(req, res) => {
        console.log(req.params.id)
        adminHelpers.findVendor(req.params.id).then((vendors) => {
            console.log(vendors)
            res.render('admin/view-vendor', {vendors})
        })
    },
    
    get_block_vendor:(req, res) => {
      console.log(req.query.id, req.query.status)
       adminHelpers.block(req.query.id, req.query.status, {vendor:true}).then((response) => {
           res.redirect('/admin/vendor/'+req.query.id)
       })

    },
    edit_vendor_get:(req, res) => {
        adminHelpers.findVendor(req.params.id).then((vendors) => {
            res.render('admin/edit-vendor', {vendors})
        })
    },
    edit_vendor_post:(req, res) => {
        adminHelpers.editVendor(req.body,req.params.id).then(() => {
            res.redirect('/admin/vendor')
        })
    },
    get_product:(req, res) => {
        adminHelpers.getAllProducts().then((products) => {
            res.render('admin/products',{products})
        })
    },
    get_orders:(req, res) => {
        adminHelpers.getOrders().then((orders) => {
            res.render('admin/orders',{orders})

        })

    },
    get_users:(req, res) => {
        adminHelpers.find({user:true}).then((users) => {
            res.render('admin/users', {users})
        })
    },
    get_block_user:(req, res) => {
        console.log(req.query.id, req.query.status)
        adminHelpers.block(req.query.id, req.query.status, {user:true}).then((resp) => {
        res.redirect('/admin/users')
        })
    }

}