const paypal = require('paypal-rest-sdk') ;

var config = paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'Ae0y8Vn06vtl7JJOGnZvTOSGfCCW3pyw77ElAOXFxnSwgIFAgzcfnz4pfKoiBLXIQnWfiOuqX6yJrtg9',
    'client_secret': 'EOxLNaV5CHKgL7_qsTAjYcL8pXaItuBAwa_v-nJNFtxPBlVMupnOBlBu_4HxNFmpXwXly78kheW6X_BC'
  });

module.exports = config