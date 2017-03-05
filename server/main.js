function cleanUpGamesAndPlayers(){
  var cutOff = moment().subtract(2, 'hours').toDate().getTime();

  var numGamesRemoved = Games.remove({
    createdAt: {$lt: cutOff}
  });

  var numPlayersRemoved = Players.remove({
    createdAt: {$lt: cutOff}
  });
}

function getRandomLocation(){
  var locationIndex = Math.floor(Math.random() * locations.length);
  return locations[locationIndex];
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function assignRoles(players, location){
  var default_role = location.roles[location.roles.length - 1];
  var roles = location.roles.slice();
  var shuffled_roles = shuffleArray(roles);
  var role = null;

  players.forEach(function(player){
    if (!player.isSpy){
      role = shuffled_roles.pop();

      if (role === undefined){
        role = default_role;
      }

      Players.update(player._id, {$set: {role: role}});
    }
  });
}

function assignCleanPlayers(players, spyIndex, n) {
  var count = 0;
  var clean_players = [];
  for (var i = 0; i < n; i++) {
    if (i != spyIndex) {
      clean_players.push(i);
    }
  }

  var playerIDs = {};
  players.forEach(function(player, index){
    playerIDs[index] = player._id;
  });

  var shuffled_players = shuffleArray(clean_players);
  var playerMap = {};
  for (var i = 0; i < shuffled_players.length; i++) {
    var index = shuffled_players[i];
    var nextIndex = shuffled_players[(i + 1) % (n - 1)];
    playerMap[index] = nextIndex;
  }

  players.forEach(function(player, index){
    if (!player.isSpy) {
      var next_id = playerIDs[playerMap[index]];
      Players.update(player._id, {$set: {knows: next_id}});
    }
  });
}

Meteor.startup(function () {
  // Delete all games and players at startup
  Games.remove({});
  Players.remove({});
});

var MyCron = new Cron(60000);

MyCron.addJob(5, cleanUpGamesAndPlayers);

Meteor.publish('games', function(accessCode) {
  return Games.find({"accessCode": accessCode});
});

Meteor.publish('players', function(gameID) {
  return Players.find({"gameID": gameID});
});

Meteor.publish('messages', function(gameID) {
    return Messages.find({"gameID": gameID});
});

Games.find({"state": 'settingUp'}).observeChanges({
  added: function (id, game) {
    var location = getRandomLocation();
    var players = Players.find({gameID: id});
    var gameEndTime = moment().add(game.lengthInMinutes, 'minutes').valueOf();

    var spyIndex = Math.floor(Math.random() * players.count());
    var firstPlayerIndex = Math.floor(Math.random() * players.count());

    players.forEach(function(player, index){
      Players.update(player._id, {$set: {
        isSpy: index === spyIndex,
        isFirstPlayer: index === firstPlayerIndex
      }});
    });

    assignCleanPlayers(players, spyIndex, players.count());

    Games.update(id, {$set: {state: 'inProgress', location: location, endTime: gameEndTime, paused: false, pausedTime: null}});
  }
});


Messages.find().observeChanges({
    added: function (id, msg) {
	var game = Games.findOne(msg.gameID);
	if (game) {
	    var messages = Messages.find({gameID: msg.gameID, roundNum: game.round});
	    var players = Players.find({gameID: msg.gameID});

	    if (messages.count() === players.count()) {
		Games.update(msg.gameID, {$set: {state: 'startHijack'}});
	    }
	}
    }
});


Players.find().observeChanges({
    added: function (id, player) {
	var game = Games.findOne(player.gameID);
	if (game) {
	    var players = Players.find({gameID: game._id});
	    var allVotesIn = true;
	    players.forEach(function(player, index) {
		if (!player.vote && !player.isSpy) {
		    allVotesIn = false;
		}
	    });
	}
	if (allVotesIn) {
	    Games.update(player.gameID, {$set: {state: 'doneVoting'}});
	}
    }
});
