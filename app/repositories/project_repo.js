const MongoContext = require('../models/mongodb');

const collection = 'projects';

exports.findOne = async (conditions) => {
    const mongoClient = await MongoContext.getInstance();
    return mongoClient.collection(collection).findOne(conditions);
};

exports.update = async (conditions, data) => {
    const mongoClient = await MongoContext.getInstance();
    return mongoClient.collection(collection).updateOne(conditions, { $set: data });
};

module.exports = exports;
