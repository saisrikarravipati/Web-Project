/* Customer routes file */

const express = require('express');
const router = express.Router();
const dbUtil = require('./../mongoDbUtil');
const authUtil = require('./../authUtil');
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;

// Returns index of found element from an array
var getIndex = function(arr, element) {
    for(var i = 0; i < arr.length; i++) {
        if(arr[i].equals(element)) {
            return i;
        }
    }
    return -1;
};

// Get customers with id endpoint
router.get('/:customerId', authUtil, function(request, response, next) {
    var customerId = request.params.customerId;
    if(customerId == null || !ObjectId.isValid(customerId)) {
        response.status(500).json({
            "error": "Customer id is invalid."
        });
        return;
    }

    var query = { _id: ObjectId(customerId) };
    dbUtil.getDb().collection("customer").findOne(query, function(error, result) {
        if (error) {
            response.status(500).json({"error": error.message});
            return;
        }

        response.status(200).json(result);
    });
});

// Create customer on register endpoint
router.post('/insert', function(request, response, next){
    var customerObj = request.body;

    if(!customerObj){
        response.status(500).json({
            "error": "Customer document invalid."
        });
        return;
    }

    bcrypt.hash(customerObj.password, 2, function(err, hash) {
        if(err){
            response.status(500).json({"error": err.message});
            return;
        }

        customerObj.password = hash;

        dbUtil.getDb().collection("customer").insertOne(customerObj, function(error, result) {
            if (error) {
                response.status(500).json({"error": error.message});
                return;
            }

            response.status(200).json({"success": result.insertedCount + " document(s) inserted"});
        });
    });

});

// Check if customer email exists
router.get('/checkemail/:customerEmail', function(request, response, next) {
    var customerEmail = request.params.customerEmail;
    if(customerEmail == null) {
        response.status(500).json({
            "error": "Customer email not valid."
        });
        return;
    }

    var query = { "email": customerEmail };
    dbUtil.getDb().collection("customer").findOne(query, function(error, result) {
        if (error) {
            response.status(500).json({"error": error.message});
            return;
        }

        var found = true;
        if(!result){
            found = false;
        }

        response.status(200).json({"found": found});
    });
});

// Customer login check
router.post('/login', function(request, response, next) {
    var customerEmail = request.body.email;
    var customerPassword = request.body.password;

    if(customerEmail == null || customerPassword == null) {
        response.status(500).json({
            "error": "Customer email or password not valid."
        });
        return;
    }

    var query = { "email": customerEmail };
    var options = { "projection": { "cart": 0, "transactions": 0 } };
    dbUtil.getDb().collection("customer").findOne(query, options, function(error, result) {
        if (error) {
            response.status(500).json({"error": error.message});
            return;
        }

        if(!result){
            response.status(500).json({"error": "Customer not found."});
            return;
        }

        bcrypt.compare(customerPassword, result.password, function(err, res) {
            if (err) {
                response.status(500).json({"error": err.message});
                return;
            }

            if(res){
                request.session.user = result.email;
                request.session.role = result.role;
                delete result.password;
                response.status(200).json({"success": true, "customer": result});
            }
            else{
                response.status(200).json({"success": false});
            }
        });
    });
});

// Gets cart info for customer
var getCartInfoForUser = function(request, response, next, customerId) {
    var query = { _id: ObjectId(customerId) };
    dbUtil.getDb().collection("customer").findOne(query, { "projection": { "cart": 1 } }, function(error, result) {
        if (error) {
            response.status(500).json({"error": error.message});
            return;
        }

        if(!result || !result.cart || !result.cart.length) {
            response.status(200).json(result);
            return;
        }

        var movieIds = [];
        for(var i = 0; i < result.cart.length; i++) {
            movieIds.push(ObjectId(result.cart[i].movieId));
        }

        dbUtil.getDb().collection("movies").find({ "_id": { $in: movieIds } }, { "projection": { "Title": 1, "Price": 1, "Stock": 1 } }).toArray(function(err, res) {
            if (err) {
                response.status(500).json({"error": err.message});
                return;
            }

            if(!res || !res.length || movieIds.length != res.length) {
                response.status(500).json({"error": "Unable to retrieve movie data."});
                return;
            }

            res.sort(function(movie1, movie2) {
                return getIndex(movieIds, movie1._id) - getIndex(movieIds, movie2._id);
            });

            for(var i = 0; i < res.length; i++) {
                res[i]['Quantity'] = result.cart[i].quantity;
            }

            result.cart = res;

            response.status(200).json(result);
        });
    });
};

// Get cart from user
router.get('/getcart/:customerId', authUtil, function(request, response, next) {
    var customerId = request.params.customerId;
    if(customerId == null || !ObjectId.isValid(customerId)) {
        response.status(500).json({
            "error": "Customer id is invalid."
        });
        return;
    }

    getCartInfoForUser(request, response, next, customerId);
});

// Add/update items to cart in customer collection
router.post('/updatecart', authUtil, function(request, response, next) {
    var cust_id = request.body.customer_id;
    var movie = request.body.movie;

    if(!cust_id || !ObjectId.isValid(cust_id) || !movie || !movie.id || !ObjectId.isValid(movie.id) || !movie.quantity) {
        response.status(500).json({"error": "Invalid movie or customer id."});
        return;
    }

    dbUtil.getDb().collection("movies").findOneAndUpdate({ $and: [{ "_id": ObjectId(movie.id) }, { "Stock": { $gte: movie.quantity } }] }, { $inc: { "Stock": -movie.quantity } }, function(error, movieObj){
        if (error) {
            response.status(500).json({"error": error.message});
            return;
        }

        if(!movieObj || !movieObj.value) {
            response.status(200).json({"error": "Movie not found or stock less than required."});
            return;
        }

        dbUtil.getDb().collection("customer").findOne({ $and: [{ "_id": ObjectId(cust_id) }, { "cart.movieId": ObjectId(movie.id) }] }, { "projection": { "cart": 1 } }, function(err, customerCart) {
            if(err) {
                response.status(500).json({"error": err.message});
                return;
            }

            if(!customerCart) {
                dbUtil.getDb().collection("customer").findOneAndUpdate({ "_id": ObjectId(cust_id) }, { $push: { "cart": { "movieId": ObjectId(movie.id), "quantity": movie.quantity } } }, function(er, result) {
                    if(er) {
                        response.status(500).json({"error": er.message});
                        return;
                    }

                    if(!result || !result.value) {
                        response.status(500).json({"error": "Failed to update cart."});
                        return;
                    }

                    getCartInfoForUser(request, response, next, cust_id);
                });
            }
            else {
                dbUtil.getDb().collection("customer").findOneAndUpdate({ $and: [{ "_id": ObjectId(cust_id) }, { "cart.movieId": ObjectId(movie.id) }] }, { $inc: { "cart.$.quantity": movie.quantity } },  function(er, result) {
                    if(er) {
                        response.status(500).json({"error": er.message});
                        return;
                    }

                    if(!result || !result.value) {
                        response.status(500).json({"error": "Failed to update cart."});
                        return;
                    }

                    getCartInfoForUser(request, response, next, cust_id);
                });
            }
        });
    });
});

// Delete items from cart collection
router.post('/deletecart', authUtil, function(request, response, next) {
    var cust_id = request.body.customer_id;
    var movies = request.body.movies;

    if(!cust_id || !ObjectId.isValid(cust_id) || !movies || !movies.length) {
        response.status(500).json({"error": "Invalid movies or customer id."});
        return;
    }

    var operations = movies.map(function(movie){
        return {
                "updateOne": {
                    "filter": { "_id": ObjectId(movie.id) },
                    "update": { $inc: { "Stock": movie.quantity }
                }
            }
        };
    });

    try {
        dbUtil.getDb().collection("movies").bulkWrite(operations, function(error, result) {
            if(error) {
                response.status(500).json({"error": error.message});
                return;
            }

            if(!result || result.modifiedCount != operations.length) {
                response.status(500).json({"error": "Unable to update movie stocks."});
                return;
            }

            var movieIds = movies.map(function(movie){
                //return { "movieId": ObjectId(movie.id) };
                return ObjectId(movie.id);
            });

            dbUtil.getDb().collection("customer").update({ "_id": ObjectId(cust_id) }, { $pull: { "cart": { "movieId": { $in: movieIds } } } }, function(err, custResult) {
                if(err) {
                    response.status(500).json({"error": err.message});
                    return;
                }

                if(!custResult || !custResult.result || custResult.result.nModified != 1){
                    response.status(500).json({"error": "Error updating customer cart."});
                    return;
                }

                getCartInfoForUser(request, response, next, cust_id);
            });
        });
    }
    catch(e) {
        response.status(500).json({"error": e.message});
        return;
    }
});

// Create transaction for customer
router.post('/transaction', authUtil, function(request, response, next) {
    var cust_id = request.body.customer_id;
    var transaction = request.body.transaction;

    if(!cust_id || !ObjectId.isValid(cust_id) || !transaction) {
        response.status(500).json({"error": "Invalid transaction or customer id."});
        return;
    }

    transaction['_id']  = new ObjectId();

    dbUtil.getDb().collection("customer").findOneAndUpdate({ "_id": ObjectId(cust_id) }, { $push: { "transactions": transaction } }, function(err, result) {
        if(err) {
            response.status(500).json({"error": err.message});
            return;
        }

        if(!result || !result.value || !result.ok) {
            response.status(500).json({"error": "Failed to create transaction."});
            return;
        }

        dbUtil.getDb().collection("customer").findOneAndUpdate({ "_id": ObjectId(cust_id) }, { $set: { "cart": [] } }, function(cartError, cartResult) {
            if(cartError) {
                response.status(500).json({"error": cartError.message});
                return;
            }

            if(!cartResult || !cartResult.value || !cartResult.ok) {
                response.status(500).json({"error": "Failed to create transaction."});
                return;
            }

            response.status(200).json({"success": true});
        });
    });
});

// Get transactions for customer
router.get('/transactions/:customerId', authUtil, function(request, response, next) {
    var customerId = request.params.customerId;
    if(customerId == null || !ObjectId.isValid(customerId)) {
        response.status(500).json({
            "error": "Customer id is invalid."
        });
        return;
    }

    var query = { _id: ObjectId(customerId) };
    var aggregate_query = [ { $match: query },
            { $project : { "transactions": 1, "_id": 0 } },
            { $unwind: "$transactions" },
            { $unwind: "$transactions.cart" },
            {
                $project: {
                    "_oid": {
                        $toObjectId: "$transactions.cart._id"
                    },
                    "org_document": "$$ROOT"
                }
            },
            {
                $lookup:{
                    "from": "movies",
                    "localField": "_oid",
                    "foreignField": "_id",
                    "as": "movie_docs"
                }
            },
            {
                $group:{
                    _id: "$org_document.transactions._id",
                    items: {
                        $push: {
                            "transaction": "$org_document.transactions",
                            "movie": { $arrayElemAt: [ "$movie_docs", 0 ] }
                        }
                    }
                }
            },
            {
                $project: { "items.transaction": 1, "items.movie.Title" : 1 }
            }
    ];

    dbUtil.getDb().collection("customer").aggregate(aggregate_query, function(filterErr, filterResult) {
        if (filterErr) {
            response.status(500).json({"error": filterErr.message});
            return;
        }

        if (!filterResult) {
            response.status(500).json({"error": "Error fetching customer transactions."});
            return;
        }

        // Reading filters aggregate
        filterResult.get(function(aggFilterErr, aggFilterRes) {
            if (aggFilterErr) {
                response.status(500).json({"error": aggFilterErr.message});
                return;
            }

            if(!aggFilterRes || !aggFilterRes.length) {
                response.status(200).json({ transactions:[] });
                return;
            }

            response.status(200).json({ transactions: aggFilterRes });
        });
    });
});

// Customer logout
router.get('/terminate/logout', function(request, response, next) {
    if(request.session){
        request.session.destroy();
    }
    response.status(200).json({"success": true});
});

module.exports = router;
