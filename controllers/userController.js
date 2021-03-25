const passport = require('passport');
const userHelper = require('../helpers/user-helper')
const objectId  = require('mongodb').ObjectID
const db = require('../config/database/connection')
const initializePassport = require('../config/authentication/passport');
const collection = require('../config/database/collection')
const multer = require('multer');
const accountSid = 'ACc9aa38dbd1436db80c50c564caa66018';
const authToken = '85f7c08ebe4866a0e661fe212fe50b64';
const serviceid = 'VA5ab0e4a18c0ac22488902b5184ed33f0';
const client = require('twilio')(accountSid, authToken);



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/profile-images/')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname+'.png')
    }
  })
   
  var upload = multer({ storage: storage }).single('profile')
var getUserByEmail = async function (email) {
    var vendor = await db.get().collection(collection.USER).findOne({email:email,$or:[{status:'unblocked'},{status:{$exists:false}}]})
    if(vendor) return vendor
    else return null
    
}
var getUserById = async function (id) {
     var vendor = await db.get().collection(collection.USER).findOne({_id:objectId(id)})
     if(vendor) return vendor
     else return null
}
var getUserByNumber = async function (phone) {
       var vendor = await db.get().collection(collection.USER).findOne({phone:phone,$or:[{status:'unblocked'},{status:{$exists:false}}]})
       if(vendor) return vendor
       else return null
}
initializePassport(passport, getUserByNumber, getUserById)

module.exports = {

    root: (req, res) => {
        
    //     client.messages
    //   .create({body: '1234', from: '+14845467119', to: '+918590462197'})
    //   .then(message => console.log(message.sid));
        if(req.user) {
            userHelper.getAllProductsWithCart(req.user._id).then((cartObj) => {

                res.render('users/home', {layout:'layoutB.hbs',user:req.user,products:cartObj.products, cartCount:cartObj.cartCount})
            })

        }
        else {
            userHelper.getAllProducts().then((products) => {
                res.render('users/home', {layout:'layoutB.hbs',user:req.user,products})
            })

        }
        
      
    },
    login_get:(req, res) => {
        res.render('users/login',{layout:'layoutB.hbs'})
        },
  login_check_number:async(req, res) => {
      var phone = req.body.phone
      console.log(req.body)
    var user = await db.get().collection(collection.USER).findOne({phone:phone})
    if(user) {
        client.verify.services(serviceid).verifications.create({to: '+918590462197', channel:'sms'})
     .then((data) => {
       console.log('hello')
       res.json({status:true})
        })
    res.json({status:true})
    }
    else {
        res.json({status:true})
        // console.log("user not found")
    }
        
        },
        
    login_post: (req, res, next) => {
        console.log(req.body)
        passport.authenticate('local',{
        successRedirect:'/',
        failureRedirect:'/login',
        failureFlash:true
    
    })(req ,res, next)
    },
    
    signup_get:(req, res) => {

        res.render('users/signup',{layout:"layoutB.hbs"})
        },
        signup_check_post:(req,res) =>{
            userHelper.signup(req.body).then((response) => {
                if(response.emailExist) {
                 res.json({emailExist:true})
                }
                
                else {       
                    client.verify.services(serviceid).verifications.create({to: '+91'+req.body.phone, channel:'sms'})
                    .then((data) => {
                      console.log(data)
                      console.log('hello')
                      res.json({response})
                       })
                 
                  }
        
            })
},
    signup_post:(req, res, next) => {
        console.log(req.body)
        var password = req.body.password
        userHelper.signup(req.body).then((response) => {
            if(response.emailExist) {
             res.json({emailExist:true})
            }
            
            else {       
                console.log('hello') 
                req.body.password = password
                passport.authenticate('local',{
                    successRedirect:'/',
                    failureRedirect:'/signup',
                    failureFlash:true
                })(req ,res, next)
              }
    
        })
    },
    logout: (req, res) =>{
        req.logOut();
        req.flash('succes_msg' , 'You are logged out')
        res.redirect('/')
    },
    get_product:(req, res) => {
        userHelper.getProduct(req.params.id).then((product) => {
            res.render('users/view-product', {layout:"layoutB.hbs", product,user:req.user})
    
        })
    },
    get_profile:(req, res) => {

        userHelper.getAddress(req.user._id).then((address) => {
            console.log(address)
            if(address.status){
                res.render('users/profile', {layout:"layoutB.hbs", user:req.user})
            }
            else {
                res.render('users/profile', {layout:"layoutB.hbs", user:req.user, address})
            }
            
        }
        )
        
    },
    post_profile_photo:(req, res) => {
        upload(req, res, (err) => {
            if(err){
              console.log(err)
            }
            else {
                console.log(req.file);
                res.redirect('/profile')
            }
        })

    },

    post_update_profile:(req, res) => {
        console.log(req.body)
        userHelper.updateProfile(req.user._id, req.body).then(() => {
            res.redirect('/profile')
        })

    },
    get_add_address:(req, res) => {
        res.render('users/addAddress', {layout:'layoutB.hbs'})
    },
     post_add_address:(req, res) => {
        req.body.user = req.user._id
        userHelper.addAddress(req.body).then(() => {
            res.redirect('/profile')
        })
     },
     get_address:(req, res) => {
         req.body.user = req.user._id
         userHelper.viewAddress(req.body).then((address) => { 
             res.render('user/address', {layout:"layoutB.hbs", user:req.user, address})

         })
     },
     save_address:(req, res) => {
         userHelper.saveAddress(req.user._id).then(() => {
             res.json({success:true})
         })

     },
     delete_address:(req, res) => {
         userHelper.deleteAddress(req.params.id).then(() => {
             res.redirect('/profile')
         })

     },
    add_to_cart:(req, res) => {
        console.log("What the fuck")
        if(req.user) {
            console.log(req.user);
            var productId = req.body.productId
            var userId = req.user._id
            userHelper.addToCart(userId, productId).then(() => {
                console.log(req.body)
                res.json({user:true})
            })
            
        }
        else {
         res.json({user:false})
        }
        
    },
    get_cart:(req, res) => {
        var id = req.user._id
        userHelper.getCartItems(id).then((cartItems) => {
            console.log(cartItems.length)
            if(cartItems.length === 0) {
                res.redirect('/')
              
            }
            else {
                userHelper.getTotalAmount(req.user._id).then((totalPrice)=>{
                    res.render('users/cart',{layout:"layoutB.hbs", user:req.user, cartItems, totalPrice})
                })
            }
            
            
        })
        
    },
    change_product_quantity:(req, res) => {
        req.body.userId = req.user._id
        userHelper.changeProductQuantity(req.body).then((response) => {
           res.json(response)
        })
    },
   remove_cart_product:(req, res) => {
       req.body.userId = req.user._id
       userHelper.removeCartProduct(req.body).then((response) => {
           res.json(response)
       })
   },
   get_total_price:(req, res) => {
       userHelper.getTotalAmount(req.user._id).then((data)=>{
           
       })
   },
   get_orders:(req, res) => {
       userHelper.getOrders(req.user._id).then((orders) => {
           res.render('users/orders', {layout:'layoutB.hbs', orders})

       })
   },
   get_checkout:(req, res) => {
    var id = req.user._id
    userHelper.getCartItems(id).then((cartItems) => {
        console.log(cartItems)
        userHelper.getTotalAmount(id).then((totalPrice)=>{
            userHelper.getAddress(req.user._id).then((address) => {
                res.render('users/checkout',{layout:"layoutB.hbs", user:req.user, cartItems, totalPrice, address})
            })
            
        })
        
    })
   },
   place_order:async(req, res) => {
    var id = req.user._id;
    req.body.user = id;
    let products = await userHelper.getCartItems(id)
 
    userHelper.placeOrder(id, req.body, products).then((orderId) => {
           
            console.log(req.body['paymentMethod'])
           if(req.body['paymentMethod'] === 'COD'){
               
            res.json({cod:true, orderId:orderId})
           }
           else if (req.body['paymentMethod']==='online-razorpay') {
              
               userHelper.generateRazorpay(orderId, req.body.totalPrice).then((order) => {
                   order.amount = parseInt(order.amount * 1000)
                   console.log(order)

                res.json({razorpay:true, order})
               })     
           }
           else if(req.body['paymentMethod']==='online-paypal') {
                 req.body._id = orderId
                var  orderdetails = req.body
                res.json({paypal:true, orderdetails})
         
           }
         
       })
   },

   verify_payment:(req, res) => {
     var id = req.user._id 
       userHelper.verifyPayment(req.body).then(() => {
           userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
            userHelper.removeCart(id).then(() => {
                res.json({payment:true})
            })
              
           })

       }).
       catch((err) => {
           console.log(err)
           console.log("payment failed")
       })
    console.log(req.body)
},

get_order_success:(req, res) => {
    var id = req.user._id
    if(req.params.id){
       
        userHelper.changePaymentStatus(req.params.id).then(() => {
            userHelper.removeCart(id).then(() => {
                res.render("users/success", {layout:'layoutB.hbs'})
            })
            
        })
    }
    else {
        res.render("users/success",{layout:'layoutB.hbs'})
        // userHelper.removeCart(id).then(() => {
        //     res.render("user/success",{layout:'layoutB.hbs'})
        // })
    }
    
},
get_order_failure:(req, res) => {
    res.render("users/failed",{layout:'layoutB.hbs'})

}
  

}