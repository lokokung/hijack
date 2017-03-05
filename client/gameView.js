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

function generateNewMessage(game, from, to, msg) {
  var msg = {
    gameID: game._id,
    roundNum: game.round,
    sendFrom: from._id,
    sendTo: to._id,
    msgContent: msg
  };

  var msgID = Messages.insert(msg);
  console.log(msgID);
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

var currentReceiver = null;

Template.gameView.helpers({
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

Template.gameView.events({
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
      if (currentReceiver) {
          currentReceiver.className = 'player-name';
      }
      currentReceiver = event.currentTarget;
      var selectedPlayer = $(event.currentTarget).parent().text();
      console.log(selectedPlayer);
  },
  'click .player-name-selected': function(event) {
      event.currentTarget.className = 'player-name';
      currentReceiver = null;
  },
  'submit #message': function (event) {
     if (currentReceiver) {
       var receiverName = $(currentReceiver).parent().text();
       var game = getCurrentGame();
	   
       var gameID = game._id;
       var roundNum = game.round;
       var sendFrom = getCurrentPlayer();
       var sendTo = Players.findOne({gameID: game._id, name: receiverName});
       var msg = event.target.privateMessage.value;
       console.log(msg);
       generateNewMessage(gameID, roundNum, sendFrom, sendTo, msg);
       event.target.className = 'hide-message-input';
       document.getElementById('confirmation-message').className = 'display-confirmation';
     } else {
       FlashMessages.sendError("Please select someone to message.");
     }

    return false;
  }
});
