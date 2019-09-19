module.exports = function(request, response, next) {
    if (request.session && request.session.user && request.session.role) {
        return next();
    }
    else {
        //return response.redirect('/index');
        return next(); // To Remove
    }
};
