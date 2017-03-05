function getCurrentGame(){
  var gameID = Session.get("gameID");

  if (gameID) {
    return Games.findOne(gameID);
  }
}

function getCurrentPlayer(){
  var playerID = Session.get("playerID");

  if (playerID) {
    return Players.findOne(playerID);
  }
}

function leaveGame () {
  GAnalytics.event("game-actions", "gameleave");
  var player = getCurrentPlayer();

  Session.set("currentView", "startMenu");
  Players.remove(player._id);

  Session.set("playerID", null);
}

function getTimeRemaining(){
  var game = getCurrentGame();
  var localEndTime = game.endTime - TimeSync.serverOffset();

  if (game.paused){
    var localPausedTime = game.pausedTime - TimeSync.serverOffset();
    var timeRemaining = localEndTime - localPausedTime;
  } else {
    var timeRemaining = localEndTime - Session.get('time');
  }

  if (timeRemaining < 0) {
    timeRemaining = 0;
  }

  return timeRemaining;
}

function recordVote(game, voteFrom, voteFor) {
  Players.update(voteFrom._id, {$set: {vote: voteFor._id}});
}

Template.voteView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  players: function () {
    var game = getCurrentGame();

    if (!game){
      return null;
    }

    var players = Players.find({
      'gameID': game._id
    });

    return players;
  },
  locations: function () {
    return locations;
  },
  gameFinished: function () {
    var timeRemaining = getTimeRemaining();

    return timeRemaining === 0;
  },
  timeRemaining: function () {
    var timeRemaining = getTimeRemaining();

    return moment(timeRemaining).format('mm[<span>:</span>]ss');
  }
});

var clickedPlayer = null;

Template.voteView.events({
  'click .btn-leave': leaveGame,
  'click .btn-end': function () {
    GAnalytics.event("game-actions", "gameend");

    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: 'waitingForPlayers'}});
  },
  'click .btn-toggle-status': function () {
    $(".status-container-content").toggle();
  },
  'click .game-countdown': function () {
    var game = getCurrentGame();
    var currentServerTime = TimeSync.serverTime(moment());

    if(game.paused){
      GAnalytics.event("game-actions", "unpause");
      var newEndTime = game.endTime - game.pausedTime + currentServerTime;
      Games.update(game._id, {$set: {paused: false, pausedTime: null, endTime: newEndTime}});
    } else {
      GAnalytics.event("game-actions", "pause");
      Games.update(game._id, {$set: {paused: true, pausedTime: currentServerTime}});
    }
  },
  'click .player-name': function (event) {
    event.currentTarget.className = 'player-name-selected';
    if (clickedPlayer) {
      clickedPlayer.className = 'player-name';
    }
    clickedPlayer = event.currentTarget;
  },
  'click .player-name-selected': function(event) {
      event.currentTarget.className = 'player-name';
      clickedPlayer = null;
  },
  'click #btn-confirm-vote': function () {
    if (clickedPlayer) {
      var votedName = $(clickedPlayer).parent().text().trim();
      var game = getCurrentGame();

      var voteFrom = getCurrentPlayer();
      var voteFor  = Players.findOne({gameID: game._id, name: votedName});
      recordVote(game._id, voteFrom, voteFor)
    } else {
      FlashMessages.sendError("Please select a player.");
    }

    return false;
  }
});
