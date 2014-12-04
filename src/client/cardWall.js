/* global io:false */
'use strict';

var CardWall = function(client) {
  var self = this;
  var $cardWall;

  $(function() {
    $cardWall = $('#cardwall');
    self.loadAll().then(self.socketConnect);
  });

  this.on = function() {
    $cardWall.show();
  };

  this.off = function() {
    $cardWall.hide();
  };

  this.loadAll = function() {
    return $.get('/cards')
      .success(self.renderAll)
      .error(self.error);
  };

  this.renderAll = function(data) {
    $.each(data.cards, function(id, card) {
      self.appendCard(card);
    });
  };

  this.socketConnect = function() {
    var socket = io.connect();
    socket.on('card.created', self.appendCard);
    socket.on('card.updated', self.updateCard);
    socket.on('card.folded', self.foldCard);
  };

  this.appendCard = function(card) {
    var $card = $('<div/>');

    if (card.parent) {
      return;
    }

    $card.addClass('card')
      .attr('id', 'card-' + card.id)
      .data('card-id', card.id)
      .addClass('card-' + card.topic)
      .html(self.htmlForCard(card))
      .hide();

    $cardWall.append($card);
    $card.fadeIn('fast');
  };

  this.updateCard = function(card) {
    var $card = $('#card-' + card.id);
    $card.html(self.htmlForCard(card));
  };

  this.foldCard = function(card) {
    var $card = $('#card-' + card.id);

    $card.slideUp('fast', function() {
      $card.remove();
    });
  };

  this.error = function(err) {
    console.error(err);
    window.alert('An error occurred.  Refer to the console for more information');
  };

  this.htmlForCard = function(card) {
    var iconMap = {
      'happy': 'fa-smile-o',
      'sad': 'fa-frown-o',
      'idea': 'fa-lightbulb-o',
      'shoutout': 'fa-bullhorn'
    };

    return [
      '<i class="fa fa-2x ',
      iconMap[card.topic],
      '"></i>',
      card.title,
      '<span class="vote-badge">', client.voting.signedVotesForCard(card.id), '</span>',
    ].join('');
  };
};

module.exports = CardWall;