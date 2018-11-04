const MongoContext = require('../models/mongodb');

const collection = 'projects';

exports.findOne = async (conditions) => {
    const mongoClient = await MongoContext.getInstance();
    return mongoClient.collection(collection).findOne(conditions);
};

module.exports = exports;
