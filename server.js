var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var User = require('./Users');

var Comment = require('./Comment');
var Discussion = require('./Discussions');

var app = express();
module.exports = app; // for testing
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code === 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    //userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, username: user.username, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});


// discussion routes
router.route('/discussions')
    .post(authJwtController.isAuthenticated, function(req,res) {
        if (!req.body.admin)
        {
            res.status(400).json({success: false, message: "Please login to create a discussion."})
        }
        else if (!req.body.topic)
        {
            res.status(400).json({success: false, message: "The topic of the discussion cannot be empty."})
        }
        else if (!req.body.description)
        {
            res.status(400).json({success: false, message: "The description of the discussion cannot be empty."})
        }
        else
        {
            var discussion = new Discussion();
            discussion.admin = req.body.admin;
            discussion.topic = req.body.topic;
            discussion.description = req.body.description;

            discussion.save(function (err)
            {
                if (err)
                {
                    if (err.code === 11000)
                    {
                        return res.status(400).json({success: false, message: "A discussion with that topic already exists."})
                    }
                    else
                    {
                        return res.send(err)
                    }
                }
                else
                {
                    res.status(200).json({success: true, message:"Successfully saved the discussion.", discussion: discussion});
                }
            })
        }
    })
    .get(authJwtController.isAuthenticated, function(req,res) {
        Discussion.aggregate([
            {
                $lookup: {
                    from: 'comment',
                    localField: 'topic',
                    foreignField: 'topic',
                    as: 'comments'
                }
            },
            {
                $project: {
                    topic: 1,
                    description: 2,
                    admin: 3,
                    comments: '$comments'
                }
            },
            {
                $sort: {
                    topic: -1
                }
            }
        ]).exec(function (err, discussion) {
            if (err) res.send(err);
            res.status(200).json({success: true, discussion: discussion});
        })
    })


// comment routes
router.route('/comment')
    .post(authJwtController.isAuthenticated, function(req,res) {
        if (!req.body.username)
        {
            res.status(400).json({success: false, message: "Please login to join the discussion."})
        }
        else if (!req.body.topic)
        {
            res.status(400).json({success: false, message: "Please choose the topic you want to discuss."})
        }
        else if (!req.body.message)
        {
            res.status(400).json({success: false, message: "The comment cannot be empty."})
        }
        else
        {
            Discussion.findOne({topic: req.body.topic}).select('topic').exec(function(err, discussion){
                if (err) res.send(err);

                if (discussion){
                    var comment = new Comment();
                    comment.username = req.body.username;
                    comment.message = req.body.message;
                    comment.topic = req.body.topic;
                    comment.time = req.body.time;

                    comment.save(function (err)
                    {
                        if (err) res.send(err);
                        else
                        {
                            res.status(200).json({success: true, message:"Successfully saved the comment.", comment: comment});
                        }
                    })
                }
                else
                {
                    res.status(400).json({success: false, message:"Cannot find this discussion."})
                }
            })
        }
    })


/*

// movies routes
router.route('/movies/:movieId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.movieId;
        Movie.findById(id, function(err, movie) {
            if (err) res.send(err);
            if (!movie)
            {
                res.json({success: false, message:"Cannot find the movie."});
            }
            else
            {
                if (req.query.reviews === 'true'){
                    Movie.aggregate([
                        {
                            $lookup: {
                                from: 'reviews',
                                localField: 'title',
                                foreignField: 'title',
                                as: 'reviews'
                            }
                        },
                        {
                            $project: {
                                title: 1,
                                actors: 2,
                                year_released: 3,
                                genre: 4,
                                imageUrl: 5,
                                averageRating: {$avg: "$reviews.rating"},
                                reviews: '$reviews'
                            }
                        }
                    ]).exec(function (err, movieidReview) {
                        if (err) res.send(err);
                        res.json(movieidReview);
                    })
                } else res.json (movie);
            }
        });
    })

    .put(authJwtController.isAuthenticated, function (req, res){
        var id = req.params.movieID;
        Movie.findById(id, function(err, movie){
            if (err) res.send(err);
            var movieJson = JSON.stringify(movie);
            movie.save(function(err){
                if(err){
                    return res.send(err);
                }
                else
                {
                    res.json({success: true, message:"Successfully updated movie", movie: movie})
                }
            })
        })
    })

router.route('/movies')
    // Get all of the movies
    .get(authJwtController.isAuthenticated, function (req, res) {
        if (req.query.reviews === 'true') {
            Movie.aggregate([
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'title',
                        foreignField: 'title',
                        as: 'reviews'
                    }
                },
                {
                    $project: {
                        title: 1,
                        actors: 2,
                        year_released: 3,
                        genre: 4,
                        imageUrl: 5,
                        averageRating: {$avg: "$reviews.rating"},
                        reviews: '$reviews'
                    }
                },
                {
                    $sort: {
                        averageRating: -1
                    }
                }
            ]).exec(function (err, movieReview) {
                if (err) res.send(err);
                res.json(movieReview);
            })
        } else
        {
            Movie.find(function (err, movies) {
                if (err) res.send(err);
                // return the movies
                res.json(movies);
            });
        }
    })

    .delete(authJwtController.isAuthenticated, function(req,res)
    {
        Movie.deleteOne({title: req.body.title}, function (err, movie){
            if (err)
            {
                res.send(err);
            }
            else if (!movie)
            {
                res.status(400).json({success: false, message: 'Cannot find this movie.'})
            }
            else
            {
                res.status(200).json({success: true, message: 'Successfully deleted the movie.'})
            }
        })
    })

    .post(authJwtController.isAuthenticated, function(req,res)
    {

        if (!req.body.title||!req.body.year_released||!req.body.genre) {
            res.json({success: false, message: 'Please enter ALL the necessary fields: title, year released, genre, actor name 1,' +
                    'character name 1, actor name 2, character name 2, actor name 3, character name 3.'});
        }

            var movie = new Movie();
            movie.title = req.body.title;
            movie.year_released = req.body.year_released;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            movie.imageUrl = req.body.imageUrl;

            // save the movie
            movie.save(function(err) {
                if (err) {
                    // duplicate entry
                    if (err.code == 11000)
                        return res.json({ success: false, message: 'A movie with that title already exists. '});
                    else
                        return res.send(err);
                }
                else
                {
                    res.json({ success: true, message: 'Movie created!', movie: movie });
                }
            });

    });

// discussion routes
router.route('/reviews')
    .post(authJwtController.isAuthenticated, function(req,res) {
        if (!req.body.comment || !req.body.rating) {
            res.status(400).json({success: false, message: 'Please enter your comment and rating together.'});
        }
        else if (!req.body.username)
        {
            res.status(400).json({success: false, message: 'Please login to leave a comment.'})
        }
        else if (!req.body.title)
        {
            res.status(400).json({success: false, message: 'Please enter the movie title.'})
        }
        else if (req.body.rating > 5 || req.body.rating < 1)
        {
            res.status(400).json({success: false, message: 'The rating can only be between 1 and 5.'})
        }
        else
        {
            Movie.findOne({title: req.body.title}).select('title').exec(function(err, movie){
                if (err) res.send(err);

                if (movie){
                    var review = new Review();
                    review.username = req.body.username;
                    review.title = req.body.title;
                    review.comment = req.body.comment;
                    review.rating = req.body.rating;

                    review.save(function (err){
                        if (err) res.send(err);
                        else
                        {

                            res.status(200).json({success: true, message: "Successfully saved the review.", review: review })
                        }
                    })
                }
                else
                {
                    res.status(400).json({success: false, message:"Cannot find this movie."})
                }
            })

        }
    })
    .get(authJwtController.isAuthenticated, function (req, res){
        if (req.query.reviews === 'true')
        {
            Movie.findOne({title: req.body.title}).select('title').exec(function (err, movie){
                if (err) res.send(err);
                if (movie)
                {
                    Movie.aggregate([
                        {
                            $lookup:{
                                from: 'reviews',
                                localField: 'title',
                                foreignField: 'title',
                                as: 'reviews'
                            },
                        },
                        {
                            $match:{
                                "title": req.body.title
                            }
                        },
                    ]).exec(function (err, movieReview){
                        if (err) res.send(err);
                        res.json({success: true, movie: movieReview})
                    })
                }
                else
                {
                    res.status(400).json({success: false, message: "Cannot find this movie."})
                }
            })
        }
        else
        {
            Movie.findOne({title: req.body.title}).exec(function(err, movie)
            {
                if (err) res.send(err);
                if (movie)
                {
                    res.status(200).json({success: true, movie: movie})
                }
                else
                {
                    res.status(400).json({success: false, message: "Cannot find this movie."})
                }
            })
        }
    });
*/

app.use('/', router);
app.listen(process.env.PORT || 8080);
