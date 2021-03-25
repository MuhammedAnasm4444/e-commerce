const collection = require('../config/database/collection')
const db = require('../config/database/connection')
const objectId = require('mongodb').ObjectID
const bcrypt = require('bcrypt')


module.exports ={
    getStats:(vendorId) => {
        return new Promise(async(resolve, reject) => {
            // var products = await db.get().collection(collection.PRODUCT).find({vendor:objectId(vendorId)}).toArray()
            // var customers = await db.get().collection(collection.ORDER).aggregate([

            // ])

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
            var addedProduct = await db.get().collection(collection.PRODUCT).insertOne(product)
            resolve(addedProduct.ops[0])
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
                }
            ]).toArray()
         console.log(orderDetails)
           resolve(orderDetails)
        })
    }

}