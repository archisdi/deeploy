const MongoContext = require('../models/mongodb');

const collection = 'servers';

exports.findOne = async (conditions) => {
    const mongoClient = await MongoContext.getInstance();
    return mongoClient.collection(collection).findOne(conditions);
};

exports.findAll = async (conditions = {}) => {
    const mongoClient = await MongoContext.getInstance();
    return mongoClient.collection(collection).find(conditions);
};

module.exports = exports;
