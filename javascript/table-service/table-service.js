// publish to local:tables.<table id>.deleted ()
// publish to local:tables.<table id>.updated (table object)
// publish to local:updateTableList (tables array of table object)
// publish to local:invitation.<user name> (tableId)

'use strict';
var autobahn = require('autobahn');

var tables = Object.create(null);
var api = Object.create(null);
var serviceName = 'com.ssp.table';
var userServiceName = 'com.ssp.user';
var tableId = 0;
var localSession = undefined;

var tableObject = {
    addUser: function (username) {
        if(!(username in this.users)) {
            this.users[username] = Object.create(null);
            return true;
        } else {
            return false;
        }
    },
    removeUser: function (username) {
        if(username in this.users) {
            delete(this.users[username]);
        }
        return true;
    },
    getPublicData: function () {
        return {users: this.users};
    }
};

//try to use a scala service instead

// api.create = function (username) {
//     return localSession.call('user:isLoggedIn', [username]).then(function (isUserLoggedIn) {
//         if (isUserLoggedIn === false) {
//             throw ['User not logged in!'];
//         }
//         var id = generateTableId();
//         var table = Object.create(tableObject);
//         table.users = Object.create(null);
//         table.addUser(username);
//         table.users[username].isInvited = true;
//         table.users[username].isJoined = true;
//         tables[id] = table;
//         console.log('Table created, id: ', id, 'by user User: ', username);
//         localSession.publish('local:updateTableList', api.list());
//         return api.get(id);
//     });
// };

api.delete = function (tableId) {
    delete(tables[tableId]);
    console.log('INFO: table deleted:', tableId);
    localSession.publish('local:tables.' + tableId + '.deleted', ['deleted']);
    localSession.publish('local:updateTableList', api.list());
    return true;
};

api.join = function (tableId, username) {
    if(!(tableId in tables))
        throw ['Table not found!'];
    if(username in tables[tableId].users && tables[tableId].users[username].isJoined === true)
        throw ['User already joined to the table.'];
    if(!(username in tables[tableId].users))
        tables[tableId].addUser(username);

    tables[tableId].users[username].isJoined = true;
    console.log('INFO Player is joined to the table:', tableId, 'user: ', username);
    localSession.publish('local:tables.' + tableId + '.updated', [], api.get(tableId));
    return api.get(tableId);
};

api.leave = function (tableId, username) {
    if(tableId in tables)
        tables[tableId].removeUser(username);
    console.log('INFO: user removed from the table:', tableId, 'user: ', username);
    localSession.publish('local:tables.' + tableId + '.updated', [], api.get(tableId));
    if(Object.keys(tables[tableId].users).length == 0)
        api.delete(tableId);
};

api.list = function () {
    var tablesPublicData = [];
    for(var tableItem in tables) {
        tablesPublicData.push(api.get(tableItem));
    }
    return tablesPublicData;
};

api.get = function (tableId) {
    if (!(tableId in tables))
        throw ['Table not found!'];
    return {id: tableId, data: tables[tableId].getPublicData()};
};

api.invite = function (tableId, username) {
    return localSession.call('user:isLoggedIn', [username]).then(function (isUserLoggedIn) {
        if(!isUserLoggedIn)
            throw ['Invited subscriber not logged in!'];
        if (!(tableId in tables))
            throw ['Table not found!'];
        if (!tables[tableId].addUser(username))
            throw ['User is already invited / joined / created to this table.'];

        tables[tableId].users[username].isInvited = true;
        console.log('INFO: User invited to the table:', tableId, 'user:', username);
        localSession.publish('local:invitation.' + String(username), [tableId]);
        localSession.publish('local:tables.' + String(tableId) + '.updated', [], api.get(tableId));
        return api.get(tableId);
    });
};

function generateTableId() {
    return 'table' + String(tableId++);
}

// connection
var connection = new autobahn.Connection({
    url: "ws://127.0.0.1:8080/ws",
    realm: "ssp-game"
});

connection.onopen =  function (session) {
    session.prefix('local', serviceName);
    session.prefix('user', userServiceName);

    console.log('INFO: Connected to the router.');
    localSession = session;

    //register all the RPC API function
    for(var apiFunction in api) {
        (function(localApiFunction) {
            session.register('local:' + String(localApiFunction), function (args) {
                return api[localApiFunction].apply(null, args);
            }).then(
                function () {
                    console.log('INFO: registered rpc function:', localApiFunction);
                },
                function (error) {
                    console.log('ERROR: could not be registered the following rpc function', localApiFunction, error);
                }
            );
        })(apiFunction);
    }

};

connection.onclose = function (reason) {
    console.log('INFO: connection to the crossbar service is closed: ', reason);
};

connection.open();
