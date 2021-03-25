const express = require('express');
const router = express.Router();

const admin = require('../controllers/adminController');
const {requireAuth, checkAdmin ,checkUser} = require('../middleware/jwtAuthMiddleware')



router.get('/', requireAuth, checkUser, admin.route)

router.get('/login', checkAdmin, admin.login_get)
router.post('/login', admin.login_post)
router.get('/logout', admin.logout_get)

// view vendors
router.get('/vendor', requireAuth, admin.vendor_get)
router.get('/vendor/:id', admin.vendor_page_get)

// add vendors
router.get('/add-vendor', requireAuth, admin.add_vendor_get)
router.post('/add-vendor', admin.add_vendor_post)

// block vendor
router.get('/block-vendor/', requireAuth, admin.get_block_vendor)

// edit vendors
router.get('/edit-vendor/:id', requireAuth, admin.edit_vendor_get);
router.post('/edit-vendor/:id', admin.edit_vendor_post)

// view products
router.get('/products', requireAuth, admin.get_product)

// block user
router.get('/users', requireAuth, admin.get_users)
router.get('/block-user', admin.get_block_user)

// orders
router.get('/orders', requireAuth, admin.get_orders)
module.exports = router;
