const { apiResponse, customError } = require('../utils/helpers');

exports.deploy = async (req, res, next) => {
    return apiResponse(res, 'successfully retrieved profile data', 200, {});
};

module.exports = exports;
