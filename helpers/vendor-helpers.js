const collection = require('../config/database/collection')
const db = require('../config/database/connection')
const objectId = require('mongodb').ObjectID
const bcrypt = require('bcrypt')


module.exports ={
    getStats:(vendorId) => {
        return new Promise(async(resolve, reject) => {
            var products = await db.get().collection(collection.PRODUCT).find({vendor:objectId(vendorId)}).toArray()
            var customers = await db.get().collection(collection.ORDER).aggregate([
                {
                    $match:{
                        product:{$elemMatch:{vendor:objectId(vendorId)}}
                    }
                },
              

            ]).toArray()
            var sales = await db.get().collection(collection.ORDER).aggregate([
                {
                    $unwind:'$product'
                },
                {
                    $match:{'status':'paid','product.vendor':vendorId}
                }
            ]).toArray()
            console.log(sales)
            resolve({products:products.length, customers:customers.length, sales:sales.length})
        })
        

    },
    find:async(id) =>{
        let vendor = await db.get().collection(collection.VENDOR).findOne(id)
        return vendor
    },
    login: async (data) => {
        const user = await db.get().collection(collection.VENDOR).findOne({email:data.email})
        console.log(user)
        if(user) {
            if(user.status === 'blocked') {
                console.log("password Matched");
                return {blocked:true}

            }
            else if(await bcrypt.compare(data.password, user.password)) {
                return {user:user}
            }
            else {
                return {passwordErr : true}


            }


        }
        else {
                return {userAlready :true}
        }
    },
    addProduct:(product) => {
        return new Promise(async(resolve, reject) => {
            product.actualPrice = product.price
            product.discount = 'false'
            var addedProduct = await db.get().collection(collection.PRODUCT).insertOne(product)
            resolve(addedProduct.ops[0])
        })
    }, 
    addOffer:(id, prices) => {
        return new Promise((resolve, reject) => { 
            db.get().collection(collection.PRODUCT).updateOne({_id:objectId(id)},{
                $set:{
                    actualPrice:prices.actualPrice,
                    discountedPrice:prices.discountPrice,
                    discount:'true',
                    price:prices.discountPrice
                }
            }).then(() => {
                resolve()
            })
            
        })

    },
    removeOffer:(id, price) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT).updateOne({_id:objectId(id)},{
                $set:{
                   
                    discountedPrice:price,
                    discount:'false',
                    price:price
                }
            }).then(() => {
                resolve()
            })

        })

    },
    getProduct:(id) => {
        return new Promise(async(resolve, reject) => {
            var product = await db.get().collection(collection.PRODUCT).findOne({_id:objectId(id)})
            resolve(product)
        })

    },
    editProduct:(id ,data) => {
        return new Promise((resolve, reject) => { 
            db.get().collection(collection.PRODUCT).updateOne({_id:objectId(id)},{
                $set:{
                    product:data.product,
                    price:data.price,
                    description:data.description,
                    description1:data.description1
                
                }

            })
            resolve(id)

        })
    },

    removeProduct:(id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT).removeOne({_id:objectId(id)})
            resolve()
        })
    },
    checkProduct:(product) => {
        return new Promise(async(resolve, reject) => {
          var sameProduct = await db.get().collection(collection.PRODUCT).findOne({product:product})
          if(sameProduct) {
              resolve(true)
          }
          else{
              resolve(false)
          }

        })

    },
    getOrders:(vendorId) => {
        return new Promise(async(resolve, reject) => {
            console.log(vendorId)
            var orderDetails = await db.get().collection(collection.ORDER).aggregate([
                
                {
                    $unwind:'$product'
                },
                {
                    $match:{'product.productDetails.vendor':objectId(vendorId)}
                },
                {
                    $lookup:{
                        from:collection.USER,
                        localField:'userId',
                        foreignField:'_id',
                        as:"user"

                    }
                },
                {
                    $unwind:'$user'
                },
                {
                    $lookup:{
                        from:collection.VENDOR,
                        localField:'product.vendor',
                        foreignField:'_id',
                        as:'vendorDetails'
                    }
                },
                {$unwind:'$vendorDetails' }
                ,{
                    $addFields:{'product.productPrice':{ $multiply: [ '$product.quantity', {$toInt:'$product.productDetails.price'}] }}
                }
            ]).toArray()
         console.log(orderDetails)
           resolve(orderDetails)
        })
    },
    setDeliveryDate:(data) => {
        console.log(data)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER).updateOne({userId:objectId(data.userId),product:{$elemMatch:{order:objectId(data.productOrderId)}}},{
                $set:{
                    "product.$.deliveryDate":data.deliveryDate,
                 
                }
            }).then((res) => {
                resolve()
            })

        })

    },
    shipProduct:(data) => {
        console.log(data)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER).updateOne({userId:objectId(data.userId),product:{$elemMatch:{order:objectId(data.productOrderId)}}},{
                $set:{
                    "product.$.status":'shipped',
                    "product.$.shipped":true
                }
            }).then((res) => {
                resolve()
            })

        })
    },
    getSalesReport:(vendorId) => {
        return new Promise(async(resolve, reject) => {
            var report = await db.get().collection(collection.ORDER).aggregate([
                {
                    $unwind:'$product'
                },
                {
                    $match:{'product.vendor':objectId(vendorId)}
                },
                {
                    $lookup:{
                        from:collection.USER,
                        localField:'userId',
                        foreignField:'_id',
                        as:'userDetails'

                    }
                },
                {
                $unwind:'$userDetails'
                }

            ]).toArray()
           resolve(report)
        })

    },
    getCustomers:(vendorId) => {
        return new Promise(async(resolve, reject) => {
            var customers = await db.get().collection(collection.ORDER).aggregate([
            
                {
                    $lookup:{
                        from:collection.USER,
                        localField:'userId',
                        foreignField:'_id',
                        as:'userDetails'
                    }
                },
                {
                    $unwind:'$userDetails'
                },
                {
                    $group:{
                        _id:'$userId',
                        "userDetails": { "$first": "$userDetails"},
                        "orderId":{"$first":"$_id"},
                        "product":{"$first":"$product"},
                        

                    }
                }
                // {
                //     $match:{'product.vendor':objectId(vendorId)}
                // },
            //     {
            //         $bucket: {
            //           groupBy: "$userId",                        // Field to group by
            // // Boundaries for the buckets
            //           default: "Other",                             // Bucket id for documents which do not fall into a bucket
            //           output: {                                     // Output for each bucket
                       
            //             "products" :
            //               {
            //                 $push: {
            //                "product":{$match:{}}
            //                 }
            //               }
            //           }
            //         }
            //       },

       
            ]).toArray()
            console.log(customers)
            resolve(customers)

        })
     
    }
}