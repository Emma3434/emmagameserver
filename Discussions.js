var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
//TODO: Review https://mongoosejs.com/docs/validation.html

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// Discussion schema
var DiscussionSchema = new Schema({
    administration: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, required: true },
    //comments: { type: Array, items: {comment: Comment}}
    comments: { type: Array }
});

// return the model
module.exports = mongoose.model('Discussion', DiscussionSchema);