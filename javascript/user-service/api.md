<a name="module_user"></a>

## user
This service provides a user handler functions like registration, login, logout, unregistration
 and different types of checks and integrations. In this module the business logic is described.


* [user](#module_user)
    * [~updateUserList()](#module_user..updateUserList) ⇒ <code>Array.&lt;publicUserData&gt;</code>
    * [~register(username, password)](#module_user..register) ⇒ <code>boolean</code>
    * [~unregister(username, password)](#module_user..unregister) ⇒ <code>boolean</code>
    * [~login(username, password)](#module_user..login) ⇒ <code>string</code>
    * [~logout(username, token)](#module_user..logout) ⇒ <code>boolean</code>
    * [~isValidLogin(username, token)](#module_user..isValidLogin) ⇒ <code>boolean</code>
    * [~isLoggedIn(username)](#module_user..isLoggedIn) ⇒ <code>boolean</code>
    * [~getUsers()](#module_user..getUsers) ⇒ <code>Array.&lt;publicUserData&gt;</code>
    * [~getLoggedInUsers()](#module_user..getLoggedInUsers) ⇒ <code>Array.&lt;publicUserData&gt;</code>

<a name="module_user..updateUserList"></a>

### user~updateUserList() ⇒ <code>Array.&lt;publicUserData&gt;</code>
Returns the public data of all of the users.

**Kind**: inner method of <code>[user](#module_user)</code>
**Api**: topic.publisher
<a name="module_user..register"></a>

### user~register(username, password) ⇒ <code>boolean</code>
Register a new subscriber in the subscriber database.

**Kind**: inner method of <code>[user](#module_user)</code>
**Returns**: <code>boolean</code> - always true if success
**Throws**:

- 'The username or the password is invalid'
- 'User already registered'

**Api**: procedure.register

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | A valid username to register, should not be falsy. |
| password | <code>string</code> | A valid password, should not be falsy. |

<a name="module_user..unregister"></a>

### user~unregister(username, password) ⇒ <code>boolean</code>
Removes a username from a user registration database.

**Kind**: inner method of <code>[user](#module_user)</code>
**Returns**: <code>boolean</code> - true, if the unregistrtation success.
**Throws**:

- 'The user is not registered.'
- 'Invalid credentials.'

**Api**: procedure.register

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | An already registered username. |
| password | <code>string</code> | A password belongs to the username. |

<a name="module_user..login"></a>

### user~login(username, password) ⇒ <code>string</code>
Give a user a logged in status by generating a token to it. With this token a user can validate any
login while not logged out.

**Kind**: inner method of <code>[user](#module_user)</code>
**Returns**: <code>string</code> - A token belongs to the user login.
**Throws**:

- 'The user is not registered'
- 'User is already logged in!'
- 'Invalid credentials.'

**Api**: procedure.register

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | An already registered username to log in. |
| password | <code>string</code> | A password which the user is registered. |

<a name="module_user..logout"></a>

### user~logout(username, token) ⇒ <code>boolean</code>
Set a user state in a user database to logged out by removing its token.

**Kind**: inner method of <code>[user](#module_user)</code>
**Returns**: <code>boolean</code> - true if the logout procedure successful.
**Throws**:

- 'Invalid credentials.'

**Api**: procedure.register

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | An already registered username in a user database. |
| token | <code>string</code> | A valid session token for a user. |

<a name="module_user..isValidLogin"></a>

### user~isValidLogin(username, token) ⇒ <code>boolean</code>
Examine that the given user registered and have a valid session token.

**Kind**: inner method of <code>[user](#module_user)</code>
**Returns**: <code>boolean</code> - returns true if the user is registered and logged in with a valid token.
**Api**: procedure.register

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | A username to check. |
| token | <code>string</code> | A session token to check. |

<a name="module_user..isLoggedIn"></a>

### user~isLoggedIn(username) ⇒ <code>boolean</code>
Examine that the user has a session token, but not checks, that it is valid or not.
Useful for status checking, when listing users and the token to check is not known.

**Kind**: inner method of <code>[user](#module_user)</code>
**Returns**: <code>boolean</code> - returns true, if the user is registered and has a session token.
**Api**: procedure.register

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | A username to check. |

<a name="module_user..getUsers"></a>

### user~getUsers() ⇒ <code>Array.&lt;publicUserData&gt;</code>
Returns the public data of all of the users.

**Kind**: inner method of <code>[user](#module_user)</code>
**Api**: procedure.register
<a name="module_user..getLoggedInUsers"></a>

### user~getLoggedInUsers() ⇒ <code>Array.&lt;publicUserData&gt;</code>
Returns the public data of the logged in users.

**Kind**: inner method of <code>[user](#module_user)</code>
**Api**: procedure.register
