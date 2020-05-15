var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
//TODO: Review https://mongoosejs.com/docs/validation.html

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// movie schema
var MovieSchema = new Schema({
    title: {type: String, required: true},
    year_released: {type: String, required: true},
    genre: {type: String, required: true},
    actors:{
        type: Array,
        required: true,
        items: {
            actorName: String,
            characterName: String
        },
        minItems: 3
    },
    imageUrl: {type: String},
    averageRating: {type: Number}
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);