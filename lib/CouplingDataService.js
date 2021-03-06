"use strict";
var monk = require('monk');
var Promise = require('rsvp').Promise;

var makeDocumentCallback = function (reject, resolve) {
    return function (error, documents) {
        if (error) {
            reject(Error(error));
        } else {
            resolve(documents);
        }
    };
};

var makeDocumentPromise = function (collection, options, filter) {
    return new Promise(function (resolve, reject) {
        collection.find(filter, options, makeDocumentCallback(reject, resolve));
    });
};

var CouplingDataService = function (mongoUrl) {
    var database = monk(mongoUrl);
    var playersCollection = database.get('players');
    var historyCollection = database.get('history');
    var tribesCollection = database.get('tribes');

    function makeTribesPromise() {
        return makeDocumentPromise(tribesCollection);
    }

    function makeHistoryPromise(tribeId) {
        return makeDocumentPromise(historyCollection, {sort: {date: -1}}, {'tribe': tribeId, isDeleted: null});
    }

    function makePlayersPromise(tribeId) {
        return makeDocumentPromise(playersCollection, {}, {'tribe': tribeId, isDeleted: null});
    }

    this.requestPlayersAndHistory = function (tribeId, dataIsAvailable, errorHandler) {
        Promise.all([makePlayersPromise(tribeId), makeHistoryPromise(tribeId)]).then(function (arrayOfResults) {
            dataIsAvailable(arrayOfResults[0], arrayOfResults[1]);
        }, function (error) {
            errorHandler({message: 'Could not read from MongoDB.', error: error});
        });
    };

    this.requestTribes = function (dataIsAvailable, errorHandler) {
        makeTribesPromise().then(dataIsAvailable, errorHandler);
    };

    this.requestHistory = function (tribeId, dataIsAvailable, errorHandler) {
        makeHistoryPromise(tribeId).then(dataIsAvailable, errorHandler);
    };

    this.requestPlayers = function (tribeId, dataIsAvailable, errorHandler) {
        makePlayersPromise(tribeId).then(dataIsAvailable, errorHandler);
    };

    this.savePairAssignmentsToHistory = function (pairs, callback) {
        historyCollection.insert(pairs, callback);
    };
    this.savePlayer = function (player, callback) {
        if (player._id) {
            playersCollection.updateById(player._id, player,
                makeUpdateByIdCallback('Player could not be updated because it could not be found.', callback));
        } else {
            playersCollection.insert(player, callback);
        }
    };
    this.removePlayer = function (playerId, done) {
        playersCollection.updateById(playerId, {isDeleted: true},
            makeUpdateByIdCallback('Failed to remove the player because it did not exist.', done));
    };

    function makeUpdateByIdCallback(failureToUpdateMessage, done) {
        return function (error, modifiedRecordCount) {
            if (modifiedRecordCount == 0 && error == null) {
                error = {message: failureToUpdateMessage};
            }
            done(error);
        };
    }

    this.removePairAssignments = function (pairAssignmentsId, done) {
        historyCollection.updateById(pairAssignmentsId, {isDeleted: true},
            makeUpdateByIdCallback('Pair Assignments could not be deleted because they do not exist.', done));
    }
};

module.exports = CouplingDataService;