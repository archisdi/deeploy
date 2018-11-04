'use strict';

const mongodb = require('mongodb');

let mongoClient = null;

const createNewConnection = () => mongodb.MongoClient.connect(process.env.MONGO_CONNECTION, { useNewUrlParser: true });

exports.boot = async () => {
    if (mongoClient) {
        return mongoClient;
    }
    mongoClient = await createNewConnection();
    return null;
};

exports.getInstance = async () => {
    if (!mongoClient) {
        await exports.boot();
    }
    return mongoClient.db(process.env.MONGO_DB);
};

exports.close = async () => {
    if (mongoClient) {
        const result = await mongoClient.close();
        mongoClient = null;
        return result;
    }
    return null;
};

module.exports = exports;
