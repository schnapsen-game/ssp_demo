console.log("Running AutobahnJS, version:" + autobahn.version);

var loggedInUser = {
    token: undefined,
    name: undefined
};
var joinedTableId = undefined;
var invitedTableId = undefined;
var tableSubscriptionUpdate = undefined;
var tableSubscriptionDelete = undefined;
var tableSubscriptionInvitation = undefined;
var connection = new autobahn.Connection({
    url: "ws://127.0.0.1:8080/ws",
    realm: "ssp-game"
});


connection.onopen = function (session, details) {
    console.log("Connected:", details);
    session.prefix('user', 'com.ssp.user');
    session.prefix('table', 'com.ssp.table');

    session.subscribe('user:updateUserList', function (users) {
        clearChildren(document.getElementById('userList'));
        fillUserList(users);
    });

    session.subscribe('table:updateTableList', function (tables) {
        clearChildren(document.getElementById('tableList'));
        fillTableList(tables);
    });

    session.call('user:getUsers').then(fillUserList);
    session.call('table:list').then(fillTableList);

    document.getElementById('register').addEventListener('click', function (event) {
        var loginData = getLoginData();
        session.call('user:register', [loginData.username, loginData.password])
            .then(function (result) {
                console.log('Successful registration.', result);})
            .catch(handleError);
        event.preventDefault();
    });

    document.getElementById('login').addEventListener('click', function (event) {
        event.preventDefault();
        if (loggedInUser.token !== undefined || loggedInUser.name !== undefined) {
            console.log('User already logged in!');
            return false;
        }

        var loginData = getLoginData();
        loggedInUser.name = loginData.username;
        session.call('user:login', [loginData.username, loginData.password])
            .then(function (result) {
                loggedInUser.token = result;
                loggedInUser.name = loginData.username;
                console.log('Successful login.', result, loggedInUser.token);
                session.call('table:list').then(fillTableList);
                return session.subscribe('table:invitation.' + loggedInUser.name, function(tableId) {
                    console.log('User invited to table:' + tableId);
                    invitedTableId = tableId;
                    if(joinedTableId !== undefined)
                        showSwapInvitation(tableId);
                    else
                        showInvitation(tableId);
                });
            })
            .then(function (subscription) {
                console.log('Subscribe for user specific invitations.');
                tableSubscriptionInvitation = subscription;
            })
            .catch(function (error) {
                loggedInUser.name = undefined;
                handleError(error);
            });
        event.preventDefault();
    });

    document.getElementById('logout').addEventListener('click', function (event) {
        event.preventDefault();
        var loginData = getLoginData();
        session.call('user:logout', [loginData.username, loggedInUser.token])
            .then(function (result) {
                loggedInUser.name = undefined;
                loggedInUser.token = undefined;
                console.log('Successful logout.', result);})
            .catch(handleError);
    });

    document.getElementById('unregsiter').addEventListener('click', function (event) {
        event.preventDefault();
        var loginData = getLoginData();
        session.call('user:unregister', [loginData.username, loginData.password])
            .then(function (result) {
                loggedInUser.name = undefined;
                loggedInUser.token = undefined;
                console.log('Successful unregistration.', result);})
            .catch(handleError);
    });

    document.getElementById('create').addEventListener('click', function (event) {
        event.preventDefault();
        if(joinedTableId !== undefined) {
            console.log('User already joined to a table:' + String(joinedTableId));
            return false;
        }
        if(invitedTableId !== undefined) {
            console.log('You have a pending invitation, handle that first!');
            return false;
        }
        if(loggedInUser.name === undefined || loggedInUser.token === undefined) {
            console.log('User not logged in.');
        }
        session.call('table:create', [loggedInUser.name])
            .then(function (tableData) {
                joinedTableId = tableData.id;
                subscribeTableSessions(joinedTableId);
                fillTableData(tableData);
                console.log('User joined to a table: ' + String(joinedTableId));
            }, handleError);
    });

    document.getElementById('delete').addEventListener('click', function (event) {
        event.preventDefault();
        if(joinedTableId === undefined) {
            console.log('Nothing to delete here...');
            return false;
        }

        session.call('table:delete', [joinedTableId])
            .then(function () {
                //joinedTableId = undefined;
                //unsubscribeTableSessions();
                //clearTableData();
                console.log('Table under deletion....');
            }, handleError)
    });

    document.getElementById('leave').addEventListener('click', function (event) {
        event.preventDefault();
        if(joinedTableId === undefined) {
            console.log('Error: You haven\'t joined to a table yet.');
            return true;
        }
        leaveTable(joinedTableId, loggedInUser.name).then(function () {
            unsubscribeTableSessions();
            console.log('You left the table.');
            joinedTableId = undefined;
        });
    });
};

connection.onclose = function (reason, details) {
    console.log("Connection lost: ", reason, details);
};
connection.open();

function joinTable(tableId, username) {
    return connection.session.call('table:join', [tableId, username])
        .then(function (tableData) {
            subscribeTableSessions(tableData.id);
            fillTableData(tableData);
            joinedTableId = tableData.id;
            console.log('You joined to the table: ' + tableId);
            return tableData;
        }, handleError);
}

function leaveTable(tableId, username) {
    return connection.session.call('table:leave', [tableId, username])
        .then(function () {
            clearTableData();
        }, handleError)
}

function subscribeTableSessions(tableId) {
    if(tableId === undefined) return false;

    connection.session.subscribe('table:tables.' + tableId + '.update', function (args, tableData) {
        console.log(args, tableData);
        fillTableData(tableData);
    },{ match: 'prefix' }).then(function (subs) {
        tableSubscriptionUpdate = subs;
        console.log('Subscription successful to table update', subs);
    }, handleError);

    connection.session.subscribe('table:tables.' + tableId + '.deleted', function () {
        joinedTableId = undefined;
        clearTableData();
        unsubscribeTableSessions();
        console.log('Table deleted!')
    }).then(function (subs) {
        tableSubscriptionDelete = subs;
        console.log('Subscription successful to table delete', subs);
    }, handleError);
    return true;
}

function unsubscribeTableSessions() {
    connection.session.unsubscribe(tableSubscriptionUpdate).then(function() { console.log('Unsubscribed from table\'s update event.') }, handleError);
    connection.session.unsubscribe(tableSubscriptionDelete).then(function() { console.log('Unsubscribed from table \'s delete event.') }, handleError);
}

function getLoginData() {
    return {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };
}

function handleError(error) {
    console.log('ERROR:', error.args.toString(), error);
}

function clearChildren(element) {
    while (element.hasChildNodes())
        element.removeChild(element.firstChild);
}

function fillUserList(users) {
    var listElement, userList, linkElement;

    userList = document.getElementById('userList');
    clearChildren(userList);
    users.forEach(function (user) {
        listElement = document.createElement('li');
        listElement.className = user.isLoggedIn ? 'user isLoggedIn' : 'user';
        listElement.textContent = user.username;
        if(user.isLoggedIn && user.username !== loggedInUser.name) {
            linkElement = document.createElement('a');
            linkElement.textContent = '[invite]';
            linkElement.setAttribute('href', '#');
            (function(localUsername) {
                linkElement.addEventListener('click', function (event) {
                    event.preventDefault();
                    if (joinedTableId === undefined) {
                        console.log('ERROR: Join a table first!');
                        return false;
                    }
                    connection.session.call('table:invite', [joinedTableId, localUsername]).catch(console.log);
                })
            })(user.username);
            listElement.appendChild(linkElement);
        }
        userList.appendChild(listElement);

    });
}

function fillTableList(tables) {
    var joinLink;
    var tableList = document.getElementById('tableList');
    tables.forEach(function (table) {
        var element = document.createElement('li');
        element.textContent = table.id;
        if(loggedInUser.name && !(loggedInUser.name in table.data.users)) {
            joinLink = document.createElement('a');
            joinLink.textContent = '[join]';
            joinLink.setAttribute('href', '#');
            (function(tableId){
                joinLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    joinTable(tableId, loggedInUser.name);
                });
            })(table.id);
            element.appendChild(joinLink);
        }
        tableList.appendChild(element);
    })
}

function fillTableData(table) {
    var username, tableUserElement;

    clearTableData();

    console.log(table);
    document.getElementById('tableDataId').textContent = table.id;
    var tableUserList = document.getElementById('tableUserList');
    for(username in table.data.users) {
        if(! Object.prototype.hasOwnProperty.call(table.data.users, username)) continue;
        tableUserElement = document.createElement('li');
        tableUserElement.textContent = username + (table.data.users[username].isJoined ? ' [joined]' : '')
            + (!table.data.users[username].isJoined && table.data.users[username].isInvited ? ' [invited]' : '');
        tableUserList.appendChild(tableUserElement);
    }
}

function showInvitation(tableId) {
    var invitationElement = document.getElementById('invitation');
    invitationElement.textContent = 'Invited:' + tableId;
    var acceptLink = document.createElement('a');
    acceptLink.textContent = '[accept]';
    acceptLink.setAttribute('href', '#');
    acceptLink.addEventListener('click', function(event) {
        event.preventDefault();
        if(invitedTableId === undefined)
            console.log('ERROR: No invitation to accept');

        joinTable(invitedTableId, loggedInUser.name)
            .then(function() {
                invitedTableId = undefined;
                hideInvitation();
            }, handleError);

    });
    invitationElement.appendChild(acceptLink);

    var declineLink = document.createElement('a');
    declineLink.textContent = '[decline]';
    declineLink.setAttribute('href', '#');
    declineLink.addEventListener('click', function(event) {
        event.preventDefault();
        if(invitedTableId === undefined)
            console.log('ERROR: No invitation to decline.');

        leaveTable(invitedTableId, loggedInUser.name)
            .then(function() {
                invitedTableId = undefined;
                hideInvitation();
                console.log('INFO: you declined the invitation.')
            }, console.log);

    });
    invitationElement.appendChild(declineLink);

}

function showSwapInvitation(tableId) {
    var invitationElement = document.getElementById('invitation');
    invitationElement.textContent = 'You have invited to ' + tableId + ' but already member of a table. Would you like to swap?';
    var swapLink = document.createElement('a');
    swapLink.setAttribute('href', '#');
    swapLink.textContent = '[swap]';
    swapLink.addEventListener('click', function (event) {
        event.preventDefault();
        leaveTable(joinedTableId, loggedInUser.name)
            .then(function () {
                unsubscribeTableSessions();
                console.log('You left the table.');
                joinedTableId = undefined;
                return joinTable(tableId, loggedInUser.name);
            })
            .catch(handleError)
            .then(function () {
                invitedTableId = undefined;
                hideInvitation();
                console.log('You have accepted the invitation, joined to the table,', tableId);
            }, console.log);

    });
    invitationElement.appendChild(swapLink);
}

function hideInvitation() {
    var invitationElement = document.getElementById('invitation');
    clearChildren(invitationElement);
    invitationElement.textContent = '';
}

function clearTableData() {
    document.getElementById('tableDataId').textContent = '';
    clearChildren(document.getElementById('tableUserList'));
}
