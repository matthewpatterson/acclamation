'use strict';

var async = require('async');
var express = require('express');
var router = express.Router();
var CardSerializer = require('../serializers/cardSerializer');
var EventPublisher = require('../eventPublisher');
var SessionResource = require('../models/sessionResource');
var SessionSerializer = require('../serializers/sessionSerializer');
var SessionsResource = require('../models/sessionsResource');

var events = new EventPublisher('acclamation:events');

router.get('/', function(req, res) {
  (new SessionsResource()).all().then(function(sessions) {
    res.render('session/index', {sessions: sessions});
  });
});

router.post('/', function(req, res) {
  (new SessionsResource()).create({
    name: req.param('name')
  }).then(function(session) {
    res.redirect('/session/' + session.id);
  });
});

router.get('/:sessionId', function(req, res) {
  (new SessionResource(req.params.sessionId)).get().then(function(session) {
    res.render('session/show', {session: session});
  }).catch(function() {
    res.send(404);
  });
});

router.get('/:sessionId/qr_code', function(req, res) {
  (new SessionResource(req.params.sessionId)).get().then(function(session) {
    var qr = session.qr();
    res.type('image/png');
    qr.on('data', function(chunk) {
      res.write(chunk);
    });
    qr.on('end', function() {
      res.end();
    });
  }).catch(function() {
    res.send(404);
  });
});

router.get('/:sessionId/export', function(req, res) {
  var session = (new SessionResource(req.params.sessionId));
  (new SessionSerializer(session)).serialize().then(function(serialized) {
    var today = new Date();
    var filename = 'acclamation_session_' +
      today.getFullYear() + '-' +
      (today.getMonth() < 9 ? '0' : '') + (today.getMonth() + 1) + '-' +
      (today.getDate() < 10 ? '0' : '') + today.getDate() + '.json';

    res.attachment(filename);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(serialized), 'utf8');
  }).catch(function() {
    res.send(404);
  });
});

router.get('/:sessionId/end', function(req, res) {
  (new SessionResource(req.params.sessionId)).get().then(function(session) {
    res.render('session/end', {session: session});
  }).catch(function() {
    res.send(404);
  });
});

router.get('/:sessionId/destroy', function(req, res) {
  (new SessionResource(req.params.sessionId)).destroy().then(function(session) {
    res.redirect('/');
  }).catch(function() {
    res.send(404);
  });
});

router.get('/:sessionId/state', function(req, res) {
  (new SessionResource(req.params.sessionId)).sessionState().get().then(function(state) {
    res.json(state);
  }).catch(function() {
    res.send(404);
  });
});

router.post('/:sessionId/state', function(req, res) {
  var sessionResource = new SessionResource(req.params.sessionId);
  sessionResource.sessionState().update({
    allowNewCards: req.param('allowNewCards'),
    allowVoting: req.param('allowVoting')
  }).then(function(state) {
    events.publish('sessionState.changed', sessionResource.id, state);
    res.send(202);
  }).catch(function() {
    res.send(404);
  });
});

router.get('/:sessionId/temperature', function(req, res) {
  (new SessionResource(req.params.sessionId)).temperature().get().then(function(temperature) {
    res.json(temperature.values);
  }).catch(function() {
    res.send(404);
  });
});

router.post('/:sessionId/temperature/vote/:value', function(req, res) {
  var sessionResource = new SessionResource(req.params.sessionId);
  sessionResource.temperature().increment(req.params.value).then(function(temperatureResource) {
    temperatureResource.get().then(function(temperature) {
      events.publish('temperature', sessionResource.id, temperature.values);
    });
    res.send(202);
  }).catch(function() {
    res.send(404);
  });
});

router.get('/:sessionId/cards', function(req, res) {
  var sessionResource = new SessionResource(req.params.sessionId);
  sessionResource.cards().all().then(function (cards) {
    async.map(cards, function(cardResource, callback) {
      (new CardSerializer(cardResource)).serialize().then(function(serialized) {
        callback(null, serialized);
      });
    }, function(err, results) {
      res.json(results);
    });
  }).catch(function() {
    res.send(404);
  });
});

router.post('/:sessionId/cards', function(req, res) {
  var sessionResource = new SessionResource(req.params.sessionId);
  sessionResource.cards().create(req.param('card')).then(function (card) {
    (new CardSerializer(card)).serialize().then(function(serialized) {
      events.publish('card.created', sessionResource.id, serialized);
    });
    res.send(202);
  }).catch(function() {
    res.send(404);
  });
});

router.post('/:sessionId/cards/:cardId', function(req, res) {
  var sessionResource = new SessionResource(req.params.sessionId);
  sessionResource.card(req.params.cardId).update({
    title: req.param('title')
  }).then(function (card) {
    (new CardSerializer(card)).serialize().then(function(serialized) {
      events.publish('card.updated', sessionResource.id, serialized);
    });
  });

  res.send(202);
});

router.post('/:sessionId/cards/:cardId/fold', function(req, res) {
  var sessionResource = new SessionResource(req.params.sessionId);
  sessionResource.card(req.params.cardId).update({
    type: 'child-card',
    parent: req.param('parent')
  }).then(function (card) {
    (new CardSerializer(card)).serialize().then(function(serialized) {
      events.publish('card.folded', sessionResource.id, serialized);
    });
  });

  res.send(202);
});

router.post('/:sessionId/cards/:cardId/vote', function(req, res) {
  var sessionResource = new SessionResource(req.params.sessionId);
  var incrBy = req.param('value') === '-1' ? (-1) : 1;

  sessionResource
    .card(req.params.cardId)
    .vote()
    .increment(incrBy)
    .then(function(cardVote) {
      (new CardSerializer(cardVote.card)).serialize().then(function(serialized) {
        events.publish('card.vote', sessionResource.id, serialized);
      });
    });

  res.send(202);
});

module.exports = router;
