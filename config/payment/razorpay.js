const Razorpay = require('razorpay');
require('dotenv').config();

var instance = new Razorpay({
    key_id: 'rzp_test_HvTWeRWYRE4mtd',
    key_secret: process.env.RAZORPAY_CLIENT_SECRET
  });

  module.exports= instance;