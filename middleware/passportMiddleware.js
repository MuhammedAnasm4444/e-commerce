module.exports = { checkAuthenticated:(req, res, next) => {
    if(req.isAuthenticated()){
        console.log("user Active ")
        next()
    }
    else  {
        console.log("user not active")
        res.redirect('/login')
    }
    },

 checkNotAuthenticated: (req, res, next) => {
    if(req.isAuthenticated()) {
        res.redirect('/vendor/dashboard')
    }
    else next()
}
}