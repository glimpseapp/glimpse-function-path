'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const express = require('express');
const app = express();

// Validate the user is logged in taking the Firebase JWT, and adding uid and email to the req.user
const validateFirebaseIdToken = (req, res, next) => {
    console.log('Check if request is authorized with Firebase ID token');

    if (req.originalUrl == '/healthz') {
        return res.send({status: true});
    }

    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).send('Unauthorized');
    }

    // Read the ID Token from the Authorization header.
    let idToken = req.headers.authorization.split('Bearer ')[1];

    admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
        console.log('ID Token correctly decoded', decodedIdToken);
        req.user = decodedIdToken;
        next();
    }).catch(error => {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).send('Unauthorized');
    });
};

app.use(validateFirebaseIdToken);


app.get('/path/:asset_name', (req, res) => {
    admin.database().ref(`/path/${req.params.asset_name}`).once('value').then(path_list => res.send(path_list.val()));
});

app.get('/path/:asset_name/:path_id', (req, res) => {
    admin.database().ref(`/path/${req.params.asset_name}/${req.params.path_id}`).once('value').then(path => res.send(path.val()));
});

app.post('/path', (req, res) => {
    var data = {
        user_id: req.user.uid,
        path: req.body.path,
        asset_name: req.body.asset_name,
        ts: Date.now()
    };
    admin.database().ref(`path/${req.body.asset_name}`).push(data, function (error) {
        if (error)
            res.send({error: error})
        else
            res.send({success: true});
    });
});

exports.path = functions.https.onRequest(app);
