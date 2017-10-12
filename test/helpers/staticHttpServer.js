const connect = require('connect');
const serveStatic = require('serve-static');

connect().use(serveStatic(__dirname, {'index': 'manualCalls.html'}))
    .listen(8087, function(){
        console.log('Server running on 8087...');
    });
