var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
//TODO: Review https://mongoosejs.com/docs/validation.html

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// Discussion schema
var DiscussionSchema = new Schema({
    username: { type: String, required: true },
    topic: { type: String, required: true },
    comment: { type: String, required: true },
    time: { type: String, required: true }
});

// return the model
module.exports = mongoose.model('Discussion', DiscussionSchema);