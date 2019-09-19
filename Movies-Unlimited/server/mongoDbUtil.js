/* MongoDb connection utility */

const mongoClient = require('mongodb').MongoClient;

var _db;
const url = process.env.db_url || "localhost:27017";
const database = process.env.db_database || "moviedb";
const fullUrl = "mongodb://" + url + "/";

var util = {
    // Connects to mongodb database
    connect: function(callback) {
        mongoClient.connect(fullUrl, {useNewUrlParser: true}, function(error, db) {
            _db = db;
            return callback(error);
        });
    },
    // get the instance of mongodb client
    getDb: function() {
        return _db.db(database);
    }
};

module.exports = util;
