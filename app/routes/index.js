const MainRoute = require('../routes/main_route');

module.exports = (app) => {
    app.use('/', MainRoute);
};
