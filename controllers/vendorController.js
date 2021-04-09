const vendorHelpers = require('../helpers/vendor-helpers');
const adminHelpers = require('../helpers/admin-helpers');
var base64ToImage = require('base64-to-image');
const jwt = require('jsonwebtoken');
const maxAge = 3 * 34 * 60 * 60;
const multer = require('multer');
const moment = require('moment');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/profile-images/')
    },
    filename: function (req, file, cb) {
      cb(null, req.vendor._id+'.png')
    }
  })
   
  var upload = multer({ storage: storage }).single('profile-vendor')

const createToken = (id) => {
    return jwt.sign({id}, 'my secret', {
        expiresIn:maxAge
    })
}

module.exports = {
    root :(req, res) => {
        vendorHelpers.getStats(req.vendor._id).then((stats) => {
            console.log(stats+"00000000000000000000000")
            res.render('vendor/dashboard', {products:stats.products, customers:stats.customers,sales:stats.sales})
        })
        
    },

    login_get:(req, res) => {
        res.render('vendor/login', {layout:false})
    },

    login_post:async(req, res, next) => {
        try {
            const Login = await vendorHelpers.login(req.body)
            if (Login.user) {
                var user  = Login.user
                const token = createToken(user._id)
                res.cookie('vendorjwt', token, {httpOnly:true, maxAge:maxAge *1000})
                res.json({status:true})
            }
            else if (Login.passwordErr) {
                res.json({passwordErr:true})
            }
            else if(Login.blocked) {
                res.json({blocked:true})
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
        res.cookie('vendorjwt', '', {maxAge:1})
        res.redirect('/vendor')
    },

    dashboard_get:(req, res) => {
       
        res.render('vendor/dashboard')
    },

    all_products_get:(req, res) => {
        adminHelpers.find({products:true,vendorId:req.vendor._id}).then((products) => {
            res.render('vendor/products', { products})
        })
        
    },

     product_get:(req, res) => {
        vendorHelpers.getProduct(req.params.id).then((product) => {
            console.log(product)
            res.render('vendor/view-product' ,{product})
        })
    },

    add_product_get:(req, res) => {
        res.render('vendor/add-product')
    },

    add_product_post:(req, res) => {
        
        
        var base64Str = req.body.base64;
        var side = req.body.base64side;
        var rear = req.body.base64rear
        var path ='./public/images/product-images/';

            delete req.body.base64
            delete req.body.base64side
            delete req.body.base64rear
 
        req.body.vendor = req.vendor._id
        if(base64Str && side && rear) {
            vendorHelpers.addProduct(req.body).then((product) => {
            
                var id = product._id
             var optionalObjThumbnail = {'fileName': id+'__thumbnail', 'type':'png'};
             var optionalObjSide = {'fileName': id+'__side', 'type':'png'};
             var optionalObjRear = {'fileName': id+'__rear', 'type':'png'};
             
             base64ToImage(base64Str,path,optionalObjThumbnail); 
             base64ToImage(side,path,optionalObjSide); 
             base64ToImage(rear,path,optionalObjRear); 
             res.redirect('/vendor/products')
         })

        }
        else {
            vendorHelpers.addProduct(req.body).then((product) => {
             res.redirect('/vendor/products')
         })

        }
        
      
        
    },
    add_offer:(req, res) => {
        console.log(req.body)
        vendorHelpers.addOffer(req.body.productId, req.body).then(() => {
            res.json({status:true})
            
        })

    },
    remove_offer:(req, res) => {
        console.log(req.query)
        vendorHelpers.removeOffer(req.query.prodId, req.query.price).then(() => {
            res.redirect('/vendor/view-product/'+req.query.prodId)

        })

    },
    edit_product_get:(req, res) => {
        vendorHelpers.getProduct(req.params.id).then((product) => {
            console.log(product)
            res.render('vendor/edit-product' ,{product})
        })

    },
    edit_product_post:(req, res)=>{

        var base64Str = req.body.base64;
        var side = req.body.base64side;
        var rear = req.body.base64rear
        var path ='./public/images/product-images/';
        
        if(base64Str  && side && rear) {
            console.log(Object.keys(req.body));
            delete req.body.base64
            delete req.body.base64side
            
            delete req.body.base64rear

        vendorHelpers.editProduct(req.params.id, req.body).then((id) => {

        
            var optionalObjThumbnail = {'fileName': id+'__thumbnail', 'type':'png'};
            var optionalObjSide = {'fileName': id+'__side', 'type':'png'};
            var optionalObjRear = {'fileName': id+'__rear', 'type':'png'};
            if(base64Str === '') console.log('no front')
            else {
                base64ToImage(base64Str,path,optionalObjThumbnail); 
            }
            if(side === '') console.log("no side")
            else  base64ToImage(side,path,optionalObjSide); 
          
           if(rear === '') console.log('no rear')
           else base64ToImage(rear,path,optionalObjRear); 
            
            res.redirect('/vendor/products')
            
        })

        }
        else {
            vendorHelpers.editProduct(req.params.id, req.body).then((id) => {
                res.redirect('/vendor/products')
            
            })
        }
       
        // vendorHelpers.editProduct(req.params.id, req.body).then((id) => {
        //     // let thumbnail = req.files.image
            
        //     thumbnail.mv('./public/images/product-images/'+id+'__thumbnail.png',(err, done) => {
        //       if(!err) {
        //         res.redirect('/vendor/products')
        //       }
        //       else {
        //           console.log('error')
        //           console.log(err)
        //       }
        //     })
            
        // })
    },
    
    delete_product:(req, res) => {
        fs.unlinkSync('./public/images/product-images/'+req.params.id+'__thumbnail.png')
        fs.unlinkSync('./public/images/product-images/'+req.params.id+'__side.png')
        fs.unlinkSync('./public/images/product-images/'+req.params.id+'__rear.png')
        vendorHelpers.removeProduct(req.params.id).then(()=>{
            res.redirect('/vendor/products')
        })
    },
    check_product_post:(req, res) => {
        vendorHelpers.checkProduct(req.body.product).then((response) => {
            if(response) {
              res.json({added:true})
            }
            else {
               res.json(false)
            }

        })
    },
    get_vendor_profile:(req, res) => { 
     
        res.render('vendor/vendor-profile', {vendor:req.vendor})
    },
    update_profile_photo:(req, res) => {
        upload(req, res, (err) => {
            if(err){
              console.log(err)
            }
            else {
                console.log(req.file);
                res.redirect('/vendor/profile')
            }
        })
    },
    get_order:(req, res) => {
        console.log(req.vendor)

        vendorHelpers.getOrders(req.vendor._id).then((order) => {
            console.log(order)
            // for(let i = 0; i<order.length;i++) {
            //     console.log(order[5].product.shipped)
            // }
            res.render('vendor/order', {order})
        })
        
    },
    set_delivery_date:(req, res) => {
        req.body.deliveryDate = new Date(req.body.deliveryDate)
        vendorHelpers.setDeliveryDate(req.body).then(() => {
            res.json({status:true})
        })
    },
    ship_product:(req, res) => {
        console.log(req.query)
        vendorHelpers.shipProduct(req.query).then(() => {
            res.redirect('/vendor/orders')

        })
    },
    get_sales_report:(req, res) => {
        var vendorId = req.vendor._id
        vendorHelpers.getSalesReport(vendorId).then((report) => {
          console.log(report)
            res.render('vendor/report', {report:report, moment:moment})
        })
        
    },
    get_customers:(req, res) => {
        var vendorId = req.vendor._id
        vendorHelpers.getCustomers(vendorId).then((customers) => {
            console.log(customers)
            res.render('vendor/customers',{customers})

        })
    }

    
    
}