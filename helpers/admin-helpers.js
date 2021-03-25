const db = require('../config/database/connection');
const collection = require('../config/database/collection');
const bcrypt = require('bcrypt')
const objectId = require('mongodb').ObjectID;
const { order } = require('paypal-rest-sdk');


module.exports = {
    getDashboardDetails:() => {
        return new Promise(async(resolve, reject) => {
            var users = await db.get().collection(collection.USER).find().toArray()
            var vendors = await db.get().collection(collection.VENDOR).find().toArray()
            var products = await db.get().collection(collection.PRODUCT).find().toArray()
            var orders = await db.get().collection(collection.ORDER).find().toArray()
            var stats = {
                users:users.length,
                vendors:vendors.length,
                products:products.length,
                orders:orders.length
            }
            resolve(stats)
        })

    },
    login: async (data) => {
        const user = await db.get().collection(collection.ADMIN).findOne({email:data.email})
        console.log(user)
        if(user) {
            if(await bcrypt.compare(data.password, user.password)) {
                console.log("password Matched");
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

    addVendor: (data) => {
        return new Promise(async(resolve ,reject) => {
            data.password = await bcrypt.hash(data.password, 10)
             db.get().collection(collection.VENDOR).insertOne(data).then((data) => {
                 resolve(data.ops[0])
             }
             )
           
        })
       

    }
    ,find: (col) => {
        return new Promise(async(resolve, reject) => {
            if(col.vendor) {
               const vendors = await db.get().collection(collection.VENDOR).find({}).toArray()    
                  resolve(vendors)
            }
            else if(col.products) {
                const vendors = await db.get().collection(collection.PRODUCT).find({vendor:objectId(col.vendorId)}).toArray()    
                  resolve(vendors)

            }
            else {
                const users = await db.get().collection(collection.USER).find({}).toArray()
                resolve(users)
            }
        })
    },
    findVendor:(id) => {
        return new Promise(async(resolve, reject) => { 
            var vendor = await db.get().collection(collection.VENDOR).findOne({_id:objectId(id)})
            resolve(vendor)
        })
    },
    editVendor:(data,id) => {
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.VENDOR).updateOne({_id:objectId(id)},{
                $set:{
                    email:data.email,
                    owner:data.owner,
                    brandName:data.brandName,
                    address:data.address,
                    phone:data.phone
                }
            })
            resolve()
        })
    },
    removeVendor:(id) => {
        return new Promise((resolve, reject) => { 
             db.get().collection(collection.VENDOR).removeVendor({_id:objectId(id)})
            resolve()
        })
    },
    getAllProducts:() => {
        return new Promise(async(resolve, reject) => {
           var products = await db.get().collection(collection.PRODUCT).aggregate([
               {
               $lookup:{
                from:collection.VENDOR,
                localField:"vendor",
                foreignField:"_id",
                as:"vendorDetails"
               }
            },
            {
                $addFields:{
                    vendorName:"$vendorDetails.owner"
                },
                
            },
            {
                $unwind:"$vendorName"
            },
            {
                $project:{
                    vendorDetails:0
                }
            }

           ]).toArray()
            resolve(products)
        })
    },
    block:(id,status, check) => {
        return new Promise((resolve, reject) => {
            if(check.vendor) {
               db.get().collection(collection.VENDOR).updateOne({_id:objectId(id)},{
                    $set:{
                        status:status,
                    }
                })
                db.get().collection(collection.PRODUCT).updateMany({vendor:objectId(id)},{
                    $set:{
                        status:status
                    }
                })
                resolve(true)
    

            }
            else {
                console.log("hellllllllllo")
             db.get().collection(collection.USER).updateOne({_id:objectId(id)},{
                    $set:{
                        status:status,
                    }
                })
                resolve(true)
    

            }
            
        })
       
    },
    getOrders:() => {
        return new Promise(async(resolve, reject) => {
            var orders = await db.get().collection(collection.ORDER).aggregate([
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
            console.log(orders)
            resolve(orders)
        })
    }
}