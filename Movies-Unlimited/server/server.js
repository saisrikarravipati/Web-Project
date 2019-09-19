/* Main server file */

const http = require('http');
const port = process.env.port || 8080;
const app = require('./app');

// Creating server
const server = http.createServer(app);

// Listening to port
server.listen(port);
