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

Template.endView.helpers({
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
  },
  voteRank: function () {
    var game = getCurrentGame();
    var players = Players.find({'gameID': game._id});
    var votes = {"a":1, "b":3, "c":2};
    /*var votes = {};
      players.forEach(function(player){
        if (!player.isSpy){
          votedFor = Players.findOne({gameID: game._id, _id: player.vote});
          if (votedFor.name in votes){
            votes[votedFor.name] = votes[votedFor.name] + 1;
          } else {
            votes[votedFor.name] = 1;
          }
        }
      }); */

    var rank = [];
    for (var key in votes) {
      var val = votes[key];
      rank.push({"name" : key, "num_votes" : val});
    }

    function compare(a,b) {
      if (a.num_votes > b.num_votes)
        return -1;
      if (a.num_votes < b.num_votes)
        return 1;
    }

    rank.sort(compare);
    return rank;
  },
  hijackerWins: function() {    
    var game = getCurrentGame();
    var players = Players.find({'gameID': game._id});
    num_clean_players = players.count() - 1;
    spy = Players.findOne({'gameID': game._id, isSpy : true});
    num_spy_votes = 0.6;
    /*players.forEach(function(player){
      if (!player.isSpy){
        votedFor = Players.findOne({gameID: game._id, _id: player.vote});
        if (votedFor.name == spy.name){
          num_spy_votes = num_spy_votes + 1;
        }
      }
    });*/
    console.log(num_spy_votes);
    if (num_spy_votes > num_clean_players / 2.0){
      return false;
    }
    return true;
  }
});

Template.endView.events({
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
  }
});
