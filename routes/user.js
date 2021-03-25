const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router()
const userContoller = require('../controllers/userController');
const {checkNotAuthenticated, checkAuthenticated} = require('../middleware/passportMiddleware');
const { route } = require('./vendor');
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = require('twilio')(accountSid, authToken);

// client.messages
//   .create({
//      body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
//      from: '+15017122661',
//      to: '+15558675310'
//    })
//   .then(message => console.log(message.sid));
const SendOtp = require('sendotp');


// home page
router.get('/', userContoller.root);

// signup routes
router.get('/signup',checkNotAuthenticated, userContoller.signup_get);
router.post('/checkSignup',userContoller.signup_check_post)
router.post('/signup', userContoller.signup_post)

// login routes
router.post('/check',userContoller.login_check_number)
router.get('/login',checkNotAuthenticated,userContoller.login_get);
router.post('/login', userContoller.login_post);
router.get('/logout' , userContoller.logout);

// product routes
router.get('/view-product/:id' ,userContoller.get_product);

// profile route
router.get('/profile', checkAuthenticated, userContoller.get_profile);
router.post('/update-profile', userContoller.post_update_profile)
router.post('/profile-photo',userContoller.post_profile_photo)

// address panel
router.get('/addAddress', userContoller.get_add_address)
router.post('/addAddress', userContoller.post_add_address)
router.get('/viewAddress/:id',userController.get_address)
router.post('/save-address',userContoller.save_address)
router.get('/delete-address/:id',userContoller.delete_address)

// cart routes
router.get('/cart',checkAuthenticated, userContoller.get_cart);
router.post('/add-to-cart', userContoller.add_to_cart);


// product quantity in cart
router.post('/change-product-quantity', userContoller.change_product_quantity)
router.post('/remove-cart-product', userContoller.remove_cart_product)


// checkout, order and place-order
router.get('/orders', userContoller.get_orders)
router.get('/checkout', userContoller.get_checkout)
router.post('/place-order', userContoller.place_order)

// payment
router.post('/verify-payment', userContoller.verify_payment);
router.get('/success/:id',checkAuthenticated,userContoller.get_order_success);
router.get('/success', userContoller.get_order_success);
router.get('/failed' , userContoller.get_order_failure);

module.exports = router;
