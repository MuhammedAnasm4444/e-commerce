const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const {checkUser, requireAuth, checkVendor} = require('../middleware/vendorjwtAuthMiddleware')


// root 
router.use('/*', checkUser)
router.get('/', requireAuth, vendorController.root)

// login routes
router.get('/login', checkVendor, vendorController.login_get)
router.post('/login', vendorController.login_post )
router.get('/logout', vendorController.logout_get)

// dashboard
router.get('/dashboard', requireAuth, vendorController.dashboard_get);

//products routes
router.get('/products', requireAuth, vendorController.all_products_get);
router.get('/view-product/:id', requireAuth, vendorController.product_get);

router.get('/add-product', requireAuth, vendorController.add_product_get);
router.post('/add-product', vendorController.add_product_post);

router.post('/check-product', vendorController.check_product_post)

router.get('/edit-product/:id', requireAuth, vendorController.edit_product_get);
router.post('/edit-product/:id',vendorController.edit_product_post)
router.get('/delete-product/:id', vendorController.delete_product);

//profile
router.get('/profile', vendorController.get_vendor_profile)
router.post('/profile-photo', vendorController.update_profile_photo)

// order 
router.get('/orders', vendorController.get_order)

module.exports = router;