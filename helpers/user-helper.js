const db =require('../config/database/connection');
const collection = require('../config/database/collection')
const bcrypt = require('bcrypt');
const objectId = require('mongodb').ObjectID;
const razorpayInstance = require('../config/payment/razorpay');
const { resolveContent } = require('nodemailer/lib/shared');
const paypal = require('paypal-rest-sdk') ;
const { resolve } = require('path');
var rand = require('random-key');
require('dotenv').config();


module.exports ={
    signup : 
    (data) => {

        return new Promise(async(resolve, reject) => {
           
            var ifUser = await db.get().collection(collection.USER).findOne({email:data.email});
            if(ifUser) resolve ({emailExist:true})
            var referalId = rand.generate(4);
            data.referalLinkId =  referalId;
            data.referals = 0
           
            if(data.referedId) {
               data.coupons = [{"coupon":"WEL"+rand.generate(3),"couponType":"welcomeCoupon"},{"coupon":'REF'+rand.generate(3),"couponType":"referalCoupon"}]
                db.get().collection(collection.USER).updateOne({referalLinkId:data.referedId},{
                   $inc:{
                       referals:1
                   },
                   $push:{
                       coupons:{coupon:'refered'+rand.generate(4), couponType:'referedCoupon'}
                   }
                }) 
            }
            else {
                data.coupons = [{"coupon":"WEL"+rand.generate(3),"couponType":"welcomeCoupon"}]

            }
            data.password =  await bcrypt.hash(data.password, 10)
    
            const user = await db.get().collection('users').insertOne(data)
            const userInfo = user.ops[0]
    
            resolve({userInfo})
        })
        
        
    },
    
    login:async(data) => {
        var user = db.get().collection('users').findOne(data)
        if (user) {
            if(await bcrypt.compare(data.password, user.password)) {

            }
            else {

            }
        }
        else {

        }

    },
    changePassword:(data) => {
        return new Promise(async(resolve, reject) => {
            data.password =  await bcrypt.hash(data.password, 10)
            db.get().collection(collection.USER).updateOne({_id:objectId(data.userId)},{
                $set:{
                    password:data.password
                }

            }).then((res) => {
                console.log(res)
                resolve()
            })
        })
    },
    checkEmailExist:(email) => {
        return new Promise(async(resolve, reject) => {
           var user = await db.get().collection(collection.USER).findOne({email:email})
           if(user) resolve(user)
           else resolve({user:false})
        })

    },
    updateProfile:(id, data) => {
        return new Promise(async(resolve, reject) => {
            
           
                db.get().collection(collection.USER).updateOne({_id:objectId(id)}, 
            {$push:  { address:data.address }, $set: {
                        name:data.name,
                        email:data.email,
                         phone:data.phone
                     }})
                     resolve()

            
            
            // [{
            //     $set:{
            //         name:data.name,
            //         email:data.email,
            //         phone:data.phone
            //     }
            // },
            // {
            //     $push: { address:data.address }
            // }]
            
        
        })
        

    },
    getAddress:(userId) => {
        return new Promise(async(resolve, reject) => {
            var orders = await db.get().collection(collection.ORDER).findOne({userId:objectId(userId)})
            var address = await db.get().collection(collection.ADDRESS).find({user:objectId(userId)}).toArray()
            console.log(orders)
            if(address) {
                if(orders) resolve({address,order:true})
                resolve({address})
            }
            else{
                if(orders) resolve({status:true,order:true})
                resolve({status:true})
            }
            
            
        })

    },
    addAddress:(data)=> {
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.ADDRESS).insertOne(data).then(() => {
                resolve()
            })

        })
    },
    viewAddress:(id) => {
        return new Promise(async(resolve, reject) => {
           var address =  db.get().collection(collection.ADDRESS).findOne({_id:objectId(id)})
           resolve(address)
        })
    },
    saveAddress:(id, data) =>{
        data.user  = id
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS).insertOne(data).then(() => {
                resolve()
            })
        })
        
    },
    deleteAddress:(id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS).removeOne({_id:objectId(id)}).then(() => {
                resolve()
            })
        })
    },
    getProduct:(id) => {
        return new Promise(async(resolve, reject) => {
            console.log(id)
            var product = await db.get().collection(collection.PRODUCT).findOne({_id:objectId(id)})
            resolve(product)
        })

    },
    getProducts:async(limit, skip) => {
        limit = parseInt(limit)
        skip  = parseInt(skip)
        var products = await db.get().collection(collection.PRODUCT).find({$or:[{status:'unblocked'},{status:{$exists:false}}]}).skip(skip).limit(limit).toArray()
        return products
    },
    getAllProducts:()=>{
        return new Promise(async(resolve, reject) => {
         
           var products = await db.get().collection(collection.PRODUCT).find({$or:[{status:'unblocked'},{status:{$exists:false}}]}).toArray()
           resolve(products)
        })
    },
    getCount:async() => {
       var count = await db.get().collection(collection.PRODUCT).countDocuments({$or:[{status:'unblocked'},{status:{$exists:false}}]})
       
       return count
    },
    getAllProductsWithCart:(userId, skip, limit)=>{
        limit = parseInt(limit)
        skip  = parseInt(skip)
        return new Promise(async(resolve, reject) => {
          
           var cart = await db.get().collection(collection.CART).findOne({user:objectId(userId)})
           console.log(cart)
           if(cart){
               console.log("product found in cart")

            var cartCount = cart.products.length
            console.log(cartCount)
            var productsCheck= await db.get().collection(collection.PRODUCT).aggregate([
                {
                   $match:{
                    $or:[{status:'unblocked'},{status:{$exists:false}}]

                   }
                },
              
                {
                    $lookup:{
                       from:collection.CART,
                       localField:'_id',
                       foreignField:'products.product',
                       as:"cart"
                    }
 
                },
                {
                    $project : { _id:1,product:1,price:1,description:1,category:1,vendor:1,status:1,
                        cart : { $filter : { input : "$cart", as : "cart", cond : { $eq : ["$$cart.user" ,userId] } } }
                    }
                }
                // ,{
                //     $match:{
                //         'cart.user':objectId(userId)
                //     }
                // }
               ,
               
                {
                    $unwind:{path: "$cart", preserveNullAndEmptyArrays: true }
                  
                }
 
            ]).skip(skip).limit(limit).toArray()
            console.log(productsCheck)
            resolve({products:productsCheck, cartCount:cartCount})

           }
           else {
            console.log("product Not found in cart")
               var products = await db.get().collection(collection.PRODUCT).find({$or:[{status:'unblocked'},{status:{$exists:false}}]}).skip(skip).limit(limit).toArray()

               resolve({products:products})
           }
           
        })
    },

    addToCart:async(userId, productId) => {
        var vendor = await db.get().collection(collection.PRODUCT).findOne({_id:objectId(productId)})
        console.log(vendor)

        let prodObj = {
             product:objectId(productId),
             order: new objectId(),
             vendor:vendor.vendor,
             quantity:1
        }
        return new Promise(async(resolve, reject) => {
            let userCart = await db.get().collection(collection.CART).findOne({user:objectId(userId)})

            if(userCart) {
                let checkProductExist = userCart.products.findIndex(products => products.product == productId) 
                console.log(checkProductExist)
                if (checkProductExist != -1) {
                    db.get().collection(collection.CART)
                        .updateOne({ user: objectId(userId), 'products.product': objectId(productId)},
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                }else {
                    db.get().collection(collection.CART)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: prodObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }

            }
            else {
                let cartObj = {
                    user:userId,
                    products:[prodObj]
                }
                db.get().collection(collection.CART).insertOne(cartObj).then(() => {
                    resolve()
                })
                
            }
        })
    },
    getCartItems:(id) => {
        return new Promise(async(resolve, reject) => {
           let cartItems = await db.get().collection(collection.CART).aggregate([
               {
                   $match:{user:objectId(id)}
               },
              
               {
                   $unwind:'$products'
               },
               {
                $project:{
                    product:'$products.product',
                    vendor:'$products.vendor',
                    order:'$products.order',
                    status:'paid',
                    quantity:'$products.quantity'

                }
                },
               {
                   $lookup:{
                       from:collection.PRODUCT,
                       localField:'product',
                       foreignField:'_id',
                       as:'productDetails'
                   }
               },
              
               {
                   $unwind:'$productDetails'
               }
               

            ]).toArray()
            resolve(cartItems)
        })
    },
    changeProductQuantity:(cart) => {
        var quantity = parseInt(cart.quantity)
        var currentQuantity = parseInt(cart.currentQuantity)
        var productId  = cart.productId
        var userId = cart.userId
        console.log(quantity, currentQuantity)
        return new Promise(async(resolve, reject) => {
            if(quantity === -1 && currentQuantity === 1){
                console.log("deleting product from the cart")
                db.get().collection(collection.CART)
                    .updateOne({user:objectId(userId)},
                        {
                            $pull: { products: { product: objectId(productId) } }
                        }   
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            }
            else {
                var cart = await db.get().collection(collection.CART).findOneAndUpdate({user:objectId(userId),'products.product':objectId(productId)}, {
                    $inc:{
                        "products.$.quantity":quantity
                    }
                })
                console.log(cart)
                resolve({status:true})

            }
           
        })
    },
    removeCartProduct:(data) => {
        var userId = data.userId
        var productId = data.productId 
        return new Promise((resolve, reject) => {
            console.log("deleting product from the cart")
            db.get().collection(collection.CART)
                .updateOne({user:objectId(userId)},
                    {
                        $pull: { products: { product: objectId(productId) } }
                    }   
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })
    },
    removeCart:(id) => {
      return new Promise((resolve, reject) => {
          console.log("deleting User's cart")
        db.get().collection(collection.CART).removeOne({user:objectId(id)}).then(() => {
            resolve()
        })
      })
    },
    verifyCoupon:(id, coupon) => {
        console.log(coupon+"cicicicicicicicicicicicicicici")
        return new Promise(async(resolve, reject) => {
            var verifiedCouponWelcome = await db.get().collection(collection.USER).findOne({
                _id:objectId(id),
                    coupons:{$elemMatch:{coupon:coupon}}},{coupons:1})
            var checkCoupon = await db.get().collection(collection.USER).aggregate([
                {
                    $match:{coupons:{$elemMatch:{coupon:coupon}}}
                },
                {
                    $unwind:'$coupons'
                },
                {
                    $match:{'coupons.coupon':coupon}
                }
            ]).toArray()
            console.log(checkCoupon)
            console.log("irjigjrijirijtrritiitijtjiti")
            if(verifiedCouponWelcome) resolve({status:true,couponType:checkCoupon[0].coupons.couponType})
            else resolve({verified:false})
        })
           
                

    },
    getTotalAmount:(userId) => {
        return new Promise(async(resolve, reject) => {
           var getTotalAmount = await db.get().collection(collection.CART).aggregate([
                {
                    $match:{
                       user:objectId(userId) 
                    }
                },
                {
                    $unwind:'$products'
                },{
                    $project: {
                        product: '$products.product',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT,
                        localField:'product',
                        foreignField:'_id',
                        as:'productDetails'
                    }
                },
                {
                    $unwind:'$productDetails'

                },
               {
                   $group:{
                       _id:null,
                       totalPrice:{$sum:{$multiply:['$quantity',{$toInt:'$productDetails.price'}]}}
                   }
               }

            ]).toArray()
            resolve(getTotalAmount[0].totalPrice)

        })
    },
    getOrders:(id) => {
        return new Promise(async(resolve, reject) => {
            var orders = await db.get().collection(collection.ORDER).find({userId:objectId(id)}).toArray()
            console.log(orders)
            resolve(orders)
        })
    },
    placeOrder:async(id, order, products) => {
        if(order.coupon) {
           coupon = order.coupon
         
            let status=order['paymentMethod']==='COD'?'placed':'pending'
            
            var orderObj = {
               
                userId:objectId(id),
                paymentMethod:order['paymentMethod'],
                product:products,
                coupon:true,
                couponType:order.coupon,
                couponValue:order.couponValue,
                totalPrice:order.totalPrice,
                date:new Date(),
                status:status,
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                   
                },

            }
            if(order['paymentMethod'] === 'COD') {
                console.log(order)
                console.log("deleting coupon value of this order")
                db.get().collection(collection.USER).updateOne({_id:objectId(id)},{
                    $pull: { coupons: { 'coupon': order.couponValue } } 
                   })
            }

        }
        else {
            
            let status=order['paymentMethod']==='COD'?'placed':'pending'
            var orderObj = {
               
                userId:objectId(id),
                paymentMethod:order['paymentMethod'],
                product:products,
                totalPrice:order.totalPrice,
                date:new Date(),
                status:status,
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                   
                },
            }

        }
       
        return new Promise((resolve, reject) => {
     db.get().collection(collection.ORDER).insertOne(orderObj).then((orderDetails) => {
         db.get().collection(collection.CART).update({user:objectId(order.userId)},{
             $set:{
                 orderStatus:"placed"
             }
         })
        console.log(orderDetails.ops[0])
        resolve(orderDetails.ops[0]._id)
          })
        })

    },
    generateRazorpay:(orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total,  // amount in the smallest currency unit
                currency: "INR",
                receipt: orderId+""
              };
              console.log("order creating kkkk")
            razorpayInstance.orders.create(options, function(err, order) {
                if(err) console.log(err)
                else {
                console.log(order);
                resolve(order)
                }
              });

        })
    },
    generatePaypal:(orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total,  // amount in the smallest currency unit
                currency: "INR",
                receipt: orderId+""
              };
              console.log("order creating kkkk")
            razorpayInstance.orders.create(options, function(err, order) {
                if(err) console.log(err)
                else {
                console.log(order);
                resolve(order)
                }
              });

        })
    },
   verifyPayment:(data) => {
       return new Promise((resolve, reject) => {
        console.log('orderId:  '+data['payment[razorpay_order_id]'])
        console.log('payment_id:  '+data['payment[razorpay_payment_id]'])
        const crypto = require('crypto');
        var hmac = crypto.createHmac('sha256', process.env.RAZORPAY_CLIENT_SECRET)
        hmac.update(data['payment[razorpay_order_id]']+'|'+data['payment[razorpay_payment_id]']);
        hmac = hmac.digest('hex')
      
           console.log(data['payment[razorpay_signature]'])
           if(hmac===data['payment[razorpay_signature]']) {
               resolve()
           }
           else {
               reject()
           }

       })
   },

   changePaymentStatus:(id,orderId) => {
       return new Promise((resolve, reject) => {
           db.get().collection(collection.ORDER).findOneAndUpdate({_id:objectId(orderId)},{
               $set:{
                   status:"paid"
               }
           }).then((order) => {
               console.log("644444444444444444444444444444444444444444444444444444444444")
               console.log(order)
               let value = order.value

               if(value != null && value.coupon) {
                   console.log('deleting coupon that used >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                db.get().collection(collection.USER).updateOne({_id:objectId(id)},{
                    $pull: { coupons: { 'couponType': value.couponType} } 
                   }).then(() => {
                    resolve()
                   })
                   
               }
               else {
                   resolve()
               }
           
            
           })
          
       } )
   },
   changeFailedPaymentStatus:(orderId) => {
       return new Promise((resolve, reject) => {
        db.get().collection(collection.ORDER).updateOne({_id:objectId(orderId)},{
            $set:{
                status:"failed Payment"
            }
        }).then((res) => {
           
         resolve()
        })
       })
   }
//   
}






























// generatePaypal:(products, orderId, totalPrice) => {
//        return new Promise ((resolve, reject) => {
//         paypal.configure({
//             'mode': 'sandbox', //sandbox or live
//             'client_id': 'Ae0y8Vn06vtl7JJOGnZvTOSGfCCW3pyw77ElAOXFxnSwgIFAgzcfnz4pfKoiBLXIQnWfiOuqX6yJrtg9',
//             'client_secret': 'EOxLNaV5CHKgL7_qsTAjYcL8pXaItuBAwa_v-nJNFtxPBlVMupnOBlBu_4HxNFmpXwXly78kheW6X_BC'
//           });
//         var create_payment_json = {
//             "intent": "sale",
//             "payer": {
//                 "payment_method": "paypal"
//             },
//             "redirect_urls": {
//                 "return_url": "http://localhost:3000/success",
//                 "cancel_url": "http://localhost:3000/cancel"
//             },
//              "transactions": [{
//         "item_list": {
//             "items": [{
//                 "name": "item",
//                 "sku": "item",
//                 "price": "1.00",
//                 "currency": "INR",
//                 "quantity": 1
//             }]
//         },
//         "amount": {
//             "currency": "INR",
//             "total": "1.00"
//         },
//         "description": "This is the payment description."
//     }]
//         };
        
        
//         paypal.payment.create(create_payment_json, function (error, payment) {
//             if (error) {
//                 throw error;
//             } else {
//                 console.log(payment);
//                 for(let i =0;i < payment.links.length; i++) {
//                     if(payment.links[i].rel === 'approval_url') {
//                         resolve(payment.links[i].href);
//                     }
//                 }
//             }
//         });
//        })
   

//    }