var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
//TODO: Review https://mongoosejs.com/docs/validation.html

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// review schema
var ReviewSchema = new Schema({
    username: {type: String, required: true},
    title: {type: String, required: true},
    comment: { type: String, required: true },
    rating: { type: Number, min:0, max:5, required: true }
});




// return the model
module.exports = mongoose.model('Review', ReviewSchema);