var MongoClient = require('mongodb').MongoClient
var state = {db :null}
module.exports.connect = function (done) {
    const url = process.env.URL
    const dbname = process.env.DB
    MongoClient.connect(url,{useUnifiedTopology:true}, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
    })
    done()

}

module.exports.get = function () {
    return state.db
}