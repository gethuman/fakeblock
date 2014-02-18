fakeblock
=========

Field-level Access Control List for Node.js and a NoSql back end such as MongoDB. Using this library you
can specify role-based permissions on your resources down to the field level for CRUD operations.

The basic idea is that you stop writing explicit authorization logic throughout your codebase regarding
the data that different users have access to and how different users can query and modify the data.
This can get really complicated and creates a lot of exception cases within your code that must be
tested and often create bugs.

Instead, you can simply create a configuration file which can be applied in a generic way for CRUD
operations. This will enable you to abstract out a lot of business logic and create a more robust application.


## Usage

First, install `fakeblock` as a dependency:

```shell
npm install --save fakeblock
```

Then, create an ACL for a particular resource. For example, something like this for your Mongo
users collection:

```javascript
// users.acl.js
module.exports = {
    update: {
        access: ['admin', 'poweruser', 'lineworker'],
        fields: {
            restricted: {
                poweruser: ['stats'],
                lineworker: ['stats', 'profile']
            }
        }
    }
};
```

With this, you can then apply the ACL to a given operation like this:

```javascript
var usersAcl = require('./users.acl');
var Fakeblock = require('fakeblock');
var data = { name: 'Joe', profile: 'me.jpg' };

// a fakeblock instance created for each user and each ACL
var fakeblock = new Fakeblock({
    name: 'users',
    acl: usersAcl,
    userId: currentUser.id,
    userRole: currentUser.role
});

// this will throw error because lineworker doesn't have access to update profile
fakeblock.applyAcl(data, 'update');

```

## Details

The basic format of the configuration file is a JSON document with the following hierarchy:

```
var acl = {
    [create|find|update|remove]: {

        // roles that have access to this operation
        access: ['role1', 'role2'],

        // as it makes sense for diff operations (i.e. select only for find)
        [select|where|fields|sort]: {

            // optional, used when roles should only have access to their own stuff
            onlyMine: {
                roles: ['role1'],
                field: 'createUserId'  // createUserId is the default
            },

            // this says that role2 can't access field1 or field2.blah
            restricted: {
                role2: ['field1', 'field2.blah']
            }

            // this says role1 can ONLY access field3 or field4.blah
            allowed: {
                role1: ['field3', 'field4.blah']
            }

            // this is saying that if role3 has no input data to applyAcl, then use this default value
            'default': {
                role3: ['-author', '-another']
            }
        }
    }
};
```