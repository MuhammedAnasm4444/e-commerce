var express = require('express')
var hbs = require('express-handlebars')
var db  = require('./config/database/connection')
var path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport')
const initializePassport = require('./config/authentication/passport');
const { userInfo } = require('os');
const session = require('express-session');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const vendorRouter = require('./routes/vendor');
const fileUpload = require('express-fileupload');
const flash = require('express-flash');


var app = express();

db.connect(()=>{
  console.log('database connected')
})

var hbsHelper = hbs.create({
    extname:'hbs',
    defaultLayout:'layout',
    layoutsDir:__dirname+'/views/layout/',
    partialsDir:__dirname+'/views/partials/',
    
    // Specify helpers which are only registered on this instance.
    helpers:{
      times: function(n, block) {
        var accum = '';
        for(var i = 1; i <= n; ++i)
            accum += block.fn(i);
        return accum;
    },
    incremented:function(index){
      index++;
      return index;
    },
    ifEquals:function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
    multiply:function(num1, num2, block) {
      num1 = parseInt(num1)
      num2 = parseInt(num2)
      return num1*num2
    }
    }
    
  });


app.use(session({secret:"kt",resave:false, saveUninitialized: false}))
// Passport Middleware
app.use(passport.initialize())
app.use(passport.session())

// connect flash
app.use(flash())

app.use(express.json({limit: '50mb'}))
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbsHelper.engine)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false,limit: '50mb'}));
// app.use(fileUpload())
// DB config


// app.use((req, res, next) => {
//    res.locals.succes_msg = req.flash('succes_msg');
//    res.locals.error_msg = req.flash('error_msg');
//    res.locals.error  = req.flash('error');
//    next();
// })
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
app.use('/', userRouter)
app.use('/admin', adminRouter)
app.use('/vendor', vendorRouter)

app.listen(3000)