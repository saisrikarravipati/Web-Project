/* Movie routes file */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const dbUtil = require('./../mongoDbUtil');
const auth = require('./../authUtil');
const ObjectId = require('mongodb').ObjectId;

// Get movies endpoint with search, filter, pagination and sort
router.post('/getmovies', auth, function(request, response, next) {
    var query = [{ "IsDeleted": false }];

    if(!request.body || !request.body.page) {
        response.status(500).json({"error": "Page number not received."});
        return;
    }

    // Adding search term to query
    if(request.body.search) {
        query.push({ $text : { $search : request.body.search } });
    }

    // Adding filters to query
    if(request.body.filters) {
        for(var i = 0; i < request.body.filters.length; i++) {
            var filter_name = request.body.filters[i]['name'];
            var filter_values = request.body.filters[i]['values'];
            var filter_obj = {};
            filter_obj[filter_name] = { $all: filter_values };
            query.push(filter_obj);
        }
    }

    var sort = {};
    // Get sort field and order
    if(request.body.sort_field) {
        sort[request.body.sort_field] = request.body.sort_order ? request.body.sort_order : -1;
    }
    else {
        // Default sort by Ratings in descending order
        sort["Ratings"] = request.body.sort_order ? request.body.sort_order : -1;
    }

    // Get result paginated data
    dbUtil.getDb().collection("movies").find({ $and: query }, { "skip": (request.body.page-1) * process.env.page_size, "limit": parseInt(process.env.page_size) }).sort(sort).toArray(function(error, result) {
        if (error) {
            response.status(500).json({"error": error.message});
            return;
        }

        // Get count of data
        dbUtil.getDb().collection("movies").aggregate([{ $match: { $and: query } }, { $group: { _id: null, count: { $sum: 1 } } }], function(countErr, countResult) {
            if (countErr) {
                response.status(500).json({"error": countErr.message});
                return;
            }

            if (!countResult) {
                response.status(500).json({"error": "Error fetching count."});
                return;
            }

            // Reading count aggregate
            countResult.get(function(aggErr, aggRes) {
                if (aggErr) {
                    response.status(500).json({"error": aggErr.message});
                    return;
                }

                if(!aggRes || !aggRes.length || !result.length) {
                    response.status(200).json({
                        data: result,
                        total: 0,
                        current_page: request.body.page,
                        page_size: parseInt(process.env.page_size),
                        total_pages: 0,
                        current_total: result.length,
                        filters: null
                    });
                    return;
                }

                if(request.body.page == 1) {

                    // Fetch aggregates for filter options
                    dbUtil.getDb().collection("movies").aggregate([{ $match: { $and: query } }, {$unwind:"$Country"}, {$unwind:"$Genre"}, {$unwind:"$Rated"}, {$unwind:"$Language"}, {$group : {_id : null, "countries" : {$addToSet : "$Country"}, "rated" : {$addToSet : "$Rated"}, "languages" : {$addToSet : "$Language"}, "genres" : {$addToSet : "$Genre"}}}], function(filterErr, filterResult) {
                        if (filterErr) {
                            response.status(500).json({"error": filterErr.message});
                            return;
                        }

                        if (!filterResult) {
                            response.status(500).json({"error": "Error fetching filter aggregations."});
                            return;
                        }

                        // Reading filters aggregate
                        filterResult.get(function(aggFilterErr, aggFilterRes) {
                            if (aggFilterErr) {
                                response.status(500).json({"error": aggFilterErr.message});
                                return;
                            }

                            if(!aggFilterRes || !aggFilterRes.length) {
                                response.status(200).json({
                                    data: result,
                                    total: aggRes[0].count,
                                    current_page: request.body.page,
                                    page_size: parseInt(process.env.page_size),
                                    total_pages: Math.ceil(aggRes[0].count / parseInt(process.env.page_size)),
                                    current_total: result.length,
                                    filters: null
                                });
                                return;
                            }

                            response.status(200).json({
                                data: result,
                                total: aggRes[0].count,
                                current_page: request.body.page,
                                page_size: parseInt(process.env.page_size),
                                total_pages: Math.ceil(aggRes[0].count / parseInt(process.env.page_size)),
                                current_total: result.length,
                                filters: aggFilterRes[0]
                            });
                        });
                    });

                }
                else {
                    response.status(200).json({
                        data: result,
                        total: aggRes[0].count,
                        current_page: request.body.page,
                        page_size: parseInt(process.env.page_size),
                        total_pages: Math.ceil(aggRes[0].count / parseInt(process.env.page_size)),
                        current_total: result.length
                    });
                }
            });
        });
    });

});


// Add movie endpoint
router.post('/', auth, function(request, response, next) {
    var movieObj = request.body;

    if(!movieObj){
        response.status(500).json({
            "error": "Movie document invalid."
        });
        return;
    }

    var image_data = movieObj.ImageData;
    delete movieObj.ImageData;

    dbUtil.getDb().collection("movies").insertOne(movieObj, function(error, result) {
        if (error) {
            response.status(500).json({"error": error.message});
            return;
        }

        var base64Data = image_data.replace(/^data:image\/jpeg+;base64,/, "");

        fs.writeFile("./images/" + result.insertedId + ".jpg", base64Data, 'base64', function(err) {
            if(err) {
                response.status(500).json({"error": err.message});
                return;
            }

            response.status(200).json({"success": result.insertedCount + " document(s) inserted"});
        });
    });
});

// Edit movie endpoint
router.put('/:id', auth, function(request, response, next) {
    var movieObj = request.body;
    var movieId = request.params.id;

    if(movieId == null || !ObjectId.isValid(movieId)) {
        response.status(500).json({
            "error": "Movie id is invalid."
        });
        return;
    }

    if(!movieObj){
        response.status(500).json({
            "error": "Movie document invalid."
        });
        return;
    }

    var image_data = movieObj.ImageData;
    delete movieObj.ImageData;

    dbUtil.getDb().collection("movies").findOneAndUpdate({ "_id": ObjectId(movieId) }, { $set: movieObj },  function(err, result) {
        if(err) {
            response.status(500).json({"error": err.message});
            return;
        }

        if(!result || !result.value) {
            response.status(500).json({"error": "Failed to update movie."});
            return;
        }

        if(image_data) {
            var base64Data = image_data.replace(/^data:image\/jpeg+;base64,/, "");

            fs.writeFile("./images/" + movieId + ".jpg", base64Data, 'base64', function(error) {
                if(error) {
                    response.status(500).json({"error": error.message});
                    return;
                }

                response.status(200).json({"success": "1 movie document updated."});
            });
        }
        else {
            response.status(200).json({"success": "1 movie document updated."});
        }
    });
});

// Delete movie endpoint
router.delete('/:id', auth, function(request, response, next) {
    var movieId = request.params.id;

    if(movieId == null || !ObjectId.isValid(movieId)) {
        response.status(500).json({
            "error": "Movie id is invalid."
        });
        return;
    }

    dbUtil.getDb().collection("movies").findOneAndUpdate({ "_id": ObjectId(movieId) }, { $set: { "IsDeleted": true } },  function(err, result) {
        if(err) {
            response.status(500).json({"error": err.message});
            return;
        }

        if(!result || !result.value) {
            response.status(500).json({"error": "Failed to delete movie."});
            return;
        }

        response.status(200).json({"success": "1 movie document deleted."});
    });
});

module.exports = router;
