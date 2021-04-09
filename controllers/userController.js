const passport = require("passport");
const userHelper = require("../helpers/user-helper");
const objectId = require("mongodb").ObjectID;
const db = require("../config/database/connection");
const initializePassport = require("../config/authentication/passport");
const initializePassportGoogle = require("../config/authentication/googleAuth");
const linkedIn = require("../config/authentication/linkedInAuth");
const collection = require("../config/database/collection");
const multer = require("multer");
const accountSid = "ACc9aa38dbd1436db80c50c564caa66018";
const authToken = "85f7c08ebe4866a0e661fe212fe50b64";
const serviceid = "VA5ab0e4a18c0ac22488902b5184ed33f0";
const client = require("twilio")(accountSid, authToken);
var sendForgotEmail = require("../config/authentication/forgotPassword");
const paginate = require("express-paginate");
const algoliasearch = require("algoliasearch");

const APP_ID = "H7DF31E15A";
const ADMIN_KEY = "1005343737e2cd07d416f72536bfbe77";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/profile-images/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + ".png");
  },
});
paginate.middleware(5, 10);

var upload = multer({ storage: storage }).single("profile");
var getUserByEmail = async function (email) {
  var vendor = await db
    .get()
    .collection(collection.USER)
    .findOne({
      email: email,
      $or: [{ status: "unblocked" }, { status: { $exists: false } }],
    });
  if (vendor) return vendor;
  else return null;
};
var getUserById = async function (id) {
  var vendor = await db
    .get()
    .collection(collection.USER)
    .findOne({ _id: objectId(id) });
  if (vendor) return vendor;
  else return null;
};
var getUserByNumber = async function (phone) {
  var vendor = await db
    .get()
    .collection(collection.USER)
    .findOne({
      phone: phone,
      $or: [{ status: "unblocked" }, { status: { $exists: false } }],
    });
  if (vendor) return vendor;
  else return null;
};
initializePassport(passport, getUserByEmail, getUserById);

module.exports = {
  root: async (req, res) => {
    const totalItems = await userHelper.getCount();
    let totalPages = Math.ceil(totalItems / parseInt(4));
    //     client.messages
    //   .create({body: '1234', from: '+14845467119', to: '+918590462197'})
    //   .then(message => console.log(message.sid));
    if (req.user) {
      totalPages = totalPages + 1;
      userHelper.getAllProductsWithCart(req.user._id, 0, 4).then((cartObj) => {
        // const itemCount = cartObj.products.length
        // const pageCount = Math.ceil(itemCount / req.query.limit);

        res.render("users/home", {
          layout: "layoutB.hbs",
          user: req.user,
          products: cartObj.products,
          cartCount: cartObj.cartCount,
          search: true,
          totalPages
          // pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
        });
      });
    } else {
      totalPages = totalPages + 1;
      userHelper.getProducts(4, 0).then((products) => {
        res.render("users/home", {
          layout: "layoutB.hbs",
          user: req.user,
          products,
          search: true,
          next: 2,
          previous: 0,
          totalPages,
        });
      });
      // userHelper.getAllProducts().then((products) => {

      //   res.render("users/home", {
      //     layout: "layoutB.hbs",
      //     user: req.user,
      //     products,
      //     search: true,
      //     // pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
      //   });

      //   // res.render("users/home", {
      //   //   layout: "layoutB.hbs",
      //   //   user: req.user,
      //   //   products,
      //   // });
      // });
    }
  },
  root_paginated: async (req, res) => {
    const totalItems = await userHelper.getCount();
    console.log(req.query.limit);
    console.log("totalItems" + totalItems);
    console.log("totalItems/limit" + totalItems / parseInt(req.query.limit));
    let totalPages = Math.ceil(totalItems / parseInt(req.query.limit));
    console.log("total Pages :" + totalPages);
    const currentPage = req.query.page;
    const page = parseInt(req.query.page);
    const limit = 3;
    let nextPage;
    let previousPage;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    console.log("endIndex: ", endIndex);
    // create an array of pages to ng-repeat in the pager control
    // let pages = Array.from(Array(endPage + 1 - startPage).keys()).map(
    //   (i) => startPage + i
    // );'
    previousPage = "0";
    nextPage = "0";
    if (endIndex < (await totalItems)) {
      nextPage = page + 1;
    }

    if (startIndex > 0) {
      previousPage = page - 1;
    }

    console.log("nextPage :" + nextPage, previousPage + " :previousPage");
    if (req.user) {
      console.log("entered cars");
      totalPages = totalPages + 1;
      userHelper
        .getAllProductsWithCart(req.user._id, startIndex, req.query.limit)
        .then((cartObj) => {
          // const itemCount = cartObj.products.length
          // const pageCount = Math.ceil(itemCount / req.query.limit);

          res.render("users/home", {
            layout: "layoutB.hbs",
            user: req.user,
            products: cartObj.products,
            cartCount: cartObj.cartCount,
            search: true,
            next: nextPage,
            previous: previousPage,
            totalPages,
            // pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
          });
        });
    } else {
      totalPages = totalPages + 1;
      console.log("startIndex: is  >>> " + startIndex);
      userHelper.getProducts(req.query.limit, startIndex).then((products) => {
        res.render("users/home", {
          layout: "layoutB.hbs",
          user: req.user,
          products,
          search: true,
          next: nextPage,
          previous: previousPage,
          totalPages,
        });
      });
    }
  },
  login_get: (req, res) => {
    var message = req.flash("message");

    res.render("users/login", { layout: "layoutB.hbs", message });
  },
  login_check_number: async (req, res) => {
    var phone = req.body.phone;
    console.log(req.body);
    var user = await db
      .get()
      .collection(collection.USER)
      .findOne({ phone: phone });
    if (user) {
      client.verify
        .services(serviceid)
        .verifications.create({ to: "+918590462197", channel: "sms" })
        .then((data) => {
          console.log("hello");
          res.json({ status: true });
        });
    } else {
      res.json({ status: true });
      // console.log("user not found")
    }
  },
  google: passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  googleAuth: (req, res, next) => {
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/login",
      failureFlash: true,
    })(req, res, next);
  },
  linkedIn: passport.authenticate("linkedin", {
    scope: ["r_emailaddress", "r_liteprofile"],
  }),
  linkedInAuth: (req, res, next) => {
    passport.authenticate("linkedin", {
      successRedirect: "/",
      failureRedirect: "/login",
      failureFlash: true,
    })(req, res, next);
  },
  get_forgot_password: (req, res) => {
    res.render("users/forgotPassword", { layout: "layoutB.hbs" });
  },

  forgot_password: (req, res, next) => {
    var email = req.body.email;
    userHelper.checkEmailExist(email).then(async (user) => {
      if (user.user === false) {
        res.json({ status: false });
      } else {
        var id = user._id;
        var Message =
          `Go to this link to change Your Password` +
          ` 
    New Password Link---->` +
          req.headers.host+"/change-password/?id=" +
          user._id;

        try {
          sendForgotEmail(email, Message);
          res.json({ status: true });
        } catch (err) {
          console.log(err);
        }
      }
    });
  },
  get_new_password: (req, res) => {
    console.log(req.query.id);
    var userId = req.query.id;
    res.render("users/changePassword", { layout: "layoutB.hbs", userId });
  },
  post_new_password: (req, res) => {
    console.log(req.body);
    userHelper.changePassword(req.body).then(() => {
      res.redirect("/login");
    });
  },
  login_post: (req, res, next) => {
    console.log(req.body);
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
      failureFlash: true,
    })(req, res, next);
  },

  signup_get: (req, res) => {
    res.render("users/signup", { layout: "layoutB.hbs" });
  },
  otp_get: (req, res) => {
    res.render("users/signupWithOtp", { layout: "layoutB.hbs" });
  },
  referal_signup_get: (req, res) => {
    console.log(req.params.referalId);
    res.render("users/signupWithReferal", {
      layout: "layoutB.hbs",
      referedId: req.params.referalId,
    });
  },
  signup_check_post: (req, res) => {
    console.log(req.user);
    client.verify
      .services(serviceid)
      .verificationChecks.create({
        to: "+91" + req.body.phone,
        code: req.body.otp,
      })
      .then((data) => {
        console.log(data);
        if (data.status === "approved") {
          console.log("otp verified");
          res.json({ success: true });
        } else {
          console.log("incorrect otp");
          res.json({ failed: true });
        }
      });
  },
  signup_post: (req, res, next) => {
    console.log(req.body);

    var password = req.body.password;
    userHelper.signup(req.body).then((response) => {
      if (response.emailExist) {
        res.json({ emailExist: true });
      } else {
        console.log("hello");
        req.body.password = password;
        passport.authenticate("local", function (err, user, info) {
          if (err) {
            return next(err);
          }
          if (!user) {
            return res.redirect("/signup");
          }
          req.logIn(user, function (err) {
            if (err) {
              return next(err);
            } else if (req.body.otp) {
              console.log(req.body.otp);

              client.verify
                .services(serviceid)
                .verifications.create({
                  to: "+91" + req.body.phone,
                  channel: "sms",
                })
                .then((data) => {
                  console.log("otp send");
                  return res.json({ status: true });
                });
            } else return res.json({ status: false });
          });
        })(req, res, next);
      }
    });
  },

  logout: (req, res) => {
    req.logOut();
    req.flash("succes_msg", "You are logged out");
    res.redirect("/");
  },
  get_about_page: (req, res) => {
    if (req.user) {
      res.render("users/about", { layout: "layoutB.hbs", user: req.user });
    } else {
      res.render("users/about", { layout: "layoutB.hbs" });
    }
  },
  get_product: (req, res) => {
    var prod;
    userHelper.getProduct(req.params.id).then((product) => {
      if (req.user) {
        userHelper.getAllProductsWithCart(req.user._id).then((cartObj) => {
          for (i of cartObj.products) {
            if (i._id + "" === req.params.id + "") {
              prod = i;
            }
          }
          res.render("users/view-product", {
            layout: "layoutB.hbs",
            product,
            user: req.user,
            prod: prod,
            cartCount: cartObj.cartCount,
          });
        });
      } else {
        res.render("users/view-product", {
          layout: "layoutB.hbs",
          product,
        });
      }
    });
  },
  get_profile: (req, res) => {
    userHelper.getAddress(req.user._id).then((response) => {
      console.log(response);
      var link = req.headers.host
      if (response.status) {
        if (response.order){

       
          res.render("users/profile", {
            layout: "layoutB.hbs",
            user: req.user,
            order:true,
            link
          });
        }
        else {
          res.render("users/profile", {
            layout: "layoutB.hbs",
            user: req.user,
            link
          });
          
        }
         
      } else {
        if (response.order) {
          res.render("users/profile", {
            layout: "layoutB.hbs",
            user: req.user,
            address:response.address,
            order:true,
            link
          });
        } else {
          res.render("users/profile", {
            layout: "layoutB.hbs",
            user: req.user,
            address:response.address,
            link
          });
        }
      }
    });
  },
  post_profile_photo: (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(req.file);
        res.redirect("/profile");
      }
    });
  },

post_update_profile: (req, res) => {
    console.log(req.body);
    userHelper.updateProfile(req.user._id, req.body).then(() => {
      res.redirect("/profile");
    });
  },
  get_add_address: (req, res) => {
    res.render("users/addAddress", { layout: "layoutB.hbs", user: req.user });
  },
  post_add_address: (req, res) => {
    req.body.user = req.user._id;
    userHelper.addAddress(req.body).then(() => {
      res.redirect("/profile");
    });
  },
  get_address: (req, res) => {
    req.body.user = req.user._id;
    userHelper.viewAddress(req.body).then((address) => {
      res.render("user/address", {
        layout: "layoutB.hbs",
        user: req.user,
        address,
      });
    });
  },
  save_address: (req, res) => {
    console.log(req.body);
    userHelper.saveAddress(req.user._id, req.body).then(() => {
      res.json({ success: true });
    });
  },
  delete_address: (req, res) => {
    userHelper.deleteAddress(req.params.id).then(() => {
      res.redirect("/profile");
    });
  },
  add_to_cart: (req, res) => {
    console.log("What the fuck");
    if (req.user) {
      console.log(req.user);
      var productId = req.body.productId;
      var userId = req.user._id;
      userHelper.addToCart(userId, productId).then(() => {
        console.log(req.body);
        res.json({ user: true });
      });
    } else {
      res.json({ user: false });
    }
  },
  get_cart: (req, res) => {
    var id = req.user._id;
    userHelper.getCartItems(id).then((cartItems) => {
      console.log(cartItems.length);
      if (cartItems.length === 0) {
        res.redirect("/");
      } else {
        userHelper.getTotalAmount(req.user._id).then((totalPrice) => {
          res.render("users/cart", {
            layout: "layoutB.hbs",
            user: req.user,
            cartItems,
            totalPrice,
            cartCount: cartItems.length,
          });
        });
      }
    });
  },
  change_product_quantity: (req, res) => {
    req.body.userId = req.user._id;
    userHelper.changeProductQuantity(req.body).then((response) => {
      res.json(response);
    });
  },
  remove_cart_product: (req, res) => {
    req.body.userId = req.user._id;
    userHelper.removeCartProduct(req.body).then((response) => {
      res.json(response);
    });
  },
  get_total_price: (req, res) => {
    userHelper.getTotalAmount(req.user._id).then((data) => {});
  },
  get_orders: (req, res) => {
    userHelper.getOrders(req.user._id).then((orders) => {
      console.log(orders);
      res.render("users/orders", {
        layout: "layoutB.hbs",
        orders,
        user: req.user,
      });
    });
  },
  get_checkout: (req, res) => {
    var id = req.user._id;
    userHelper.getCartItems(id).then((cartItems) => {
      console.log(cartItems);
      userHelper.getTotalAmount(id).then((totalPrice) => {
        userHelper.getAddress(req.user._id).then((address) => {
          res.render("users/checkout", {
            layout: "layoutB.hbs",
            user: req.user,
            cartItems,
            cartLength: cartItems.length,
            totalPrice,
            address:address.address,
          });
        });
      });
    });
  },
  verify_coupon: (req, res) => {
    console.log(req.body);
    var coupon = req.body.coupon;
    userHelper.verifyCoupon(req.user._id, coupon).then((response) => {
      res.json(response);
    });
  },

  place_order: async (req, res) => {
    var id = req.user._id;
    console.log(req.body);
    req.body.user = id;
    let products = await userHelper.getCartItems(id);

    userHelper.placeOrder(id, req.body, products).then((orderId) => {
      console.log(req.body["paymentMethod"]);
      if (req.body["paymentMethod"] === "COD") {
        res.json({ cod: true, orderId: orderId });
      } else if (req.body["paymentMethod"] === "online-razorpay") {
        userHelper
          .generateRazorpay(orderId, req.body.totalPrice)
          .then((order) => {
            order.amount = parseInt(order.amount * 1000);
            console.log(order);

            res.json({ razorpay: true, order });
          });
      } else if (req.body["paymentMethod"] === "online-paypal") {
        req.body._id = orderId;
        var orderdetails = req.body;
        res.json({ paypal: true, orderdetails });
      }
    });
  },

  verify_payment: (req, res) => {
    var id = req.user._id;
    userHelper
      .verifyPayment(req.body)
      .then(() => {
        userHelper
          .changePaymentStatus(id, req.body["order[receipt]"])
          .then(() => {
            userHelper.removeCart(id).then(() => {
              res.json({ payment: true });
            });
          });
      })
      .catch((err) => {
        console.log(err);
        console.log("payment failed");
      });
    console.log(req.body);
  },

  get_order_success: (req, res) => {
    var id = req.user._id;
    if (req.params.id) {
      userHelper.changePaymentStatus(req.params.id).then(() => {
        userHelper.removeCart(id).then(() => {
          res.render("users/success", {
            layout: "layoutB.hbs",
            user: req.user,
          });
        });
      });
    } else {
      res.render("users/success", { layout: "layoutB.hbs", user: req.user });
      // userHelper.removeCart(id).then(() => {
      //     res.render("user/success",{layout:'layoutB.hbs'})
      // })
    }
  },
  get_order_failure: (req, res) => {
    userHelper.changeFailedPaymentStatus(req.params.id).then(() => {
      res.render("users/failed", { layout: "layoutB.hbs", user: req.user });
    });
  },
};

