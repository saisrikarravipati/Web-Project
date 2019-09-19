/* Application routes file */

const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const dbUtil = require('./mongoDbUtil');
const pageRoutes = require("./page");
const customerRoutes = require('./api/customer');
const movieRoutes = require('./api/movies');

// Using morgan module for logging
app.use(morgan('dev'));

// Parsing JSON body data in requests
app.use(express.json({limit: '50mb'}));

// Database connection code
dbUtil.connect(function(error){
    if(error){
        console.log(error);
    }
});

// Setting up session
app.use(session({
    secret: process.env.app_secret,
    resave: true,
    saveUninitialized: true,
    cookie : {
        maxAge : process.env.app_timeout * 1000
    }
}));

// Web Page routes
app.use("/", pageRoutes);

// Static file routes (For CSS, JS, Images)
app.use("/css", express.static(path.join(__dirname, '../css')));
app.use("/js", express.static(path.join(__dirname, '../js')));
app.use("/images", express.static(path.join(__dirname, '../images')));

// API routes
app.use("/customer", customerRoutes);
app.use("/movies", movieRoutes);

// Throwing error if requests reach this line instead of using the above customerRoutes
app.use(function(request, response, next){
    var error = new Error('Not found');
    error.status = 404;
    next(error);
});

// Handling errors thrown in the application
app.use(function(error, request, response, next){
    console.log(error.message);
    response.status(error.status || 500);
    response.json({
        "error": error.message
    });
});

// Module export
module.exports = app;
