/* Web page routes file */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const authUtil = require('./authUtil');

// Get index page
router.get('/index', function(request, response, next) {
    fs.readFile('index.html', function(err, data) {
        if(err){
            throw err;
        }
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
});

// Get main page
router.get('/mainpage', authUtil, function(request, response, next) {
    fs.readFile('mainpage.html', function(err, data) {
        if(err){
            throw err;
        }
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
});

// Get checkout page
router.get('/checkout', authUtil, function(request, response, next) {
    fs.readFile('checkout.html', function(err, data) {
        if(err){
            throw err;
        }
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
});

// Get transactions page
router.get('/transaction', authUtil, function(request, response, next) {
    fs.readFile('transaction.html', function(err, data) {
        if(err){
            throw err;
        }
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
});

module.exports = router;
