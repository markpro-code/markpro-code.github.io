# Javascript Full Stack Guide

This is a guide for develop a web app with: Express.js + MogoDB + React.

## Table of Contents

-   [Build Server](#build-server)
    -   [Three Layer Archtecture](#three-layer-archtecture)
    -   [Router: control request flow](#router-control-request-flow)
    -   [Controllers: handle request](#controllers-handle-request)
    -   [Services: implement business logic](#services-implement-business-logic)
    -   [DB Model](#db-model)
    -   [Authentication with Username and Password](#authentication-with-username-and-password)
    -   [Authentication with CAS](#authentication-with-cas)
    -   [Authentication with JWT](#authentication-with-jwt)
-   [Build Client](#build-client)
-   [Complexity Control](#complexity-control)
    -   [Dependency Injection](#dependency-injection)
    -   [Customer Errors](#customer-errors)
-   [Configuration](#configuration)
-   [Related Node Modules](#related-node-modules)

## Build Server

### Three Layer Archtecture

1.  **Controller Layer**: handle request from routes, validate request, decide render a view or call a service.
2.  **Service Layer**: perform business logic, CRUD or call another service.
3.  **Data Access Layer**

Why 3 layers ? Scalibility and Modularity, as app grows, you can still hold the complexity.

Don’t put business logic inside controller layer, as it will become messy when write unit test, you have to mock every reqest and response. use service layer for your business logic.

### Router: control request flow

```javascript
// router.js

const ctrl = require('./controllers/product')

router.post('/api/product', ...ctrl.addProduct)
router.delete('/api/product/:id', ...ctrl.deleteProduct)
router.put('/api/product/:id', ...ctrl.updateProduct)
router.get('/api/product/:id', ...ctrl.getProduct)
router.get('/api/product-list', ...ctrl.getProductList)
```

### Controllers: handle request

Inside controller layer, this is the place we retrieve and validate request data, call servce methods. [express-validator](https://www.npmjs.com/package/express-validator) is a handy tool for validation.

```javascript
// controllers/product.js

const { body, param } = require('express-validator')
const productService = require('../services/product')

const updateProduct = [
    // validation
    param('id').trim().not().isEmpty().withMessage('missing param id'),
    body('productName').trim().not().isEmpty().withMessage('missing product name'),
    body('propertyCode').trim().not().isEmpty().withMessage('missing product code'),
    handleValidationError,

    (req, res, next) => {
        productService.updateProduct(req.params.id, req.body)
            .then(() => sendData(res))
            .catch(next)
    },
]

module.exports = {
    updateProduct,
}
```

### Services: implement business logic

Inside service layer, this is the place you put all your business logic, perform CRUD operation.

```javascript
// services/product.js

const { ProductModel } = require('../data-access/product.js')

async function addProduct(product) {
    const p = new ProductModel(product)
    await p.save()
}

async function updateProduct(id, product) {
    await ProductModel.findByIdAndUpdate(id, project)
}

module.exports = {
    addProduct,
    updateProduct,
}
```

### DB Model

Inside data access layer, this is the place implement database entity modeling. [mongoose](https://mongoosejs.com/) is a common used MongoDB object modeling tool.

```javascript
// data-access/product.js

const mongoose = require('mongoose')

const schema = {
    productCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    productName: {
        type: String,
        required: true,
        trim: true,
    },
}

this.Schema = new mongoose.Schema(schema, {
    timestamps: true,
    strictQuery: 'throw',
})

const ProductModel = mongoose.model('product', this.Schema)

module.exports = {
    ProductModel,
}
```

### Authentication with Username and Password

let's start with authentication strategy:

1.  User enters username and password
2.  web app checks if they are matching user in the database
3.  If they are matching, set cookie with session id that will be used to authenticate further pages
4.  When the user visits other pages, the cookie with session id will be added to all the requests
5.  Authenticate restricted pages with this cookie

Use [passport.js](https://www.npmjs.com/package/passport) and it's [passport-local](https://www.npmjs.com/package/passport-local) strategy can simplify the implementation.

app.js

```javascript
const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const flash = require('connect-flash')


const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(flash())

app.use(session({
    store: new MemoryStore({
        checkPeriod: 86400000,
    }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())
```

NOTE: you must init passport middleware after `app.use(session)`

router.js

```javascript
const userCtrl = require('controllers/user')

router.post('/login', ...userCtrl.login)
```

controllers/user.js

```javascript
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const user = require('../servcies/user')

passport.use(new LocalStrategy(
    {
        usernameField: 'username',  // request field for username
        passwordField: 'password',  // request field for password
    },
    function(username, password, done) {
        user
            .validateUser(username, password)
            .then(result => {
                if(result.pass){
                    done(null, result.userInfo)
                }else{
                    done(null, false)
                }
            })
            .catch(done)
    }
));

// serialize user id to session
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// deserialize user id from session
passport.deserializeUser(function(id, done) {
    // retrieve user info from DB
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

const login = [
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true,
    },
]

const getUserInfo = [
    (req, res, next) => {
        // this will trigger passport.deserializeUser() function call and retrieve user info
        sendData(res, res.user)
    }
]

module.exports = {
    login,
    getUserInfo,
}
```

After user login successfully, express middleware function can get user info from subsequent request by `req.user`.

services/user.js

```javascript
const bcrypt = require('bcrypt')
const UserModel = require('data-access/user')
async function validateUser(username, password) {
    return UserModel
        // find user in DB
        .findOne({ username })
        .then(userInfo => {
            if(userInfo == null) {
                return { pass: false, message: 'incorrect username' }
            }

            return bcrypt.compare(password, userInfo.hashedPassword)
                .then(equal => ({
                    pass: equal,
                    message: equal ? null : 'incorrect password',
                    userInfo,
                }))
        })

}

module.export = {
    validateUser
}
```

[bcrypt](https://www.npmjs.com/package/bcrypt) is a node module for encrypt and decrypt. **Confidential data should always store encrypted**, we should only save hashed password in database. `bcrypt.compare(password, hashedPassword)` use to compare true password and hashed password.

### Authentication with CAS

If you are not familiar with CAS, check out [How CAS Works](00002_how_cas_works.md).

Connect to Central Authentication Service is quite easy by [connect-cas2](https://www.npmjs.com/package/connect-cas2).

app.js

```javascript
const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const ConnectCas = require('connect-cas2')

const casClient = new ConnectCas({
    debug: true,
    ignore: [],
    // match: [/\/api\/.*/],
    servicePrefix: config.get('cas.servicePrefix'),
    serverPath: config.get('cas.serverPath'),
    paths: {
        validate: '/api/cas/validate',
        serviceValidate: '/serviceValidate',
        proxy: '/proxy',
        login: '/login',
        logout: '/logout',
        proxyCallback: '',
        restletIntegration: {},
    },

    redirect: false,
    gateway: false,
    renew: false,
    slo: true,
    cache: {
        enable: false,
        ttl: 5 * 60 * 1000,
        filter: [],
    },
    fromAjax: {
        header: 'x-client-ajax',
        status: 418,
    },
})


const app = express()
app.use(session({
    store: new MemoryStore({
        checkPeriod: 86400000,
    }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}))

// NOTICE: If you want to enable single sign logout,
// you must use casClient middleware before bodyParser.
app.use(casClient.core())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
```

controllers/user.js

```javascript
const logout = [
    (req, res, next) => {
        casClient.logout()(req, res, next)
    },
]

const getUserInfo = [
    (req, res, next) => {
        sendData(res, req.session.cas.user)
    },
]

module.exports = {
    logout,
    getUserInfo,
}

```

### Authentication with JWT

## Build Client

## Complexity Control

As application grows, are you still able to hold it ?

### Dependency Injection

Also called Inversion of Control.
[typedi](https://www.npmjs.com/package/typedi)

### Customer Errors

Customer error can simplify validation process

## Configuration

[dotenv](https://www.npmjs.com/package/dotenv)
[convict](https://www.npmjs.com/package/convict)

configuration validation

## Related Node Modules

1.  [axios](https://www.npmjs.com/package/axios): request client form both clent and server

server:

1.  [express-validator](https://www.npmjs.com/package/express-validator): request validation
2.  [mongoose](https://mongoosejs.com/): MongoDB data modeling.
3.  [bcrypt](https://www.npmjs.com/package/bcrypt): encrypt and decrypt
4.  [passport.js](https://www.npmjs.com/package/passport): authentication middleware
5.  [connect-cas2](https://www.npmjs.com/package/connect-cas2): CAS authentication

client:

1.  [redux-devtools-extension](https://www.npmjs.com/package/redux-devtools-extension)
1.  [redux](https://www.npmjs.com/package/redux), [react-redux](https://www.npmjs.com/package/react-redux): client state management
1.  [react-router](https://www.npmjs.com/package/react-router), [react-router-dom](https://www.npmjs.com/package/react-router-dom): client router
1.  [moment](https://www.npmjs.com/package/moment), [react-moment](https://www.npmjs.com/package/react-moment): time dispaly

tools:

1. [nodemon](https://www.npmjs.com/package/nodemon): automatically restart node server when file changes.
1. [concurrently](https://www.npmjs.com/package/concurrently): run multiple commands concurrently, like start server app and client dev server at the same time.
