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

function getMessages(messagesArray) {
    messages = [];
    messagesArray.forEach( function(msg, index) {
	var fromPlayer = Players.findOne(msg.sendFrom);

	var message = { message: msg.msgContent, 
			from: fromPlayer.name };
	messages.push(message);
    });

    return messages;
}

Template.revealView.events({
  'click .btn-continue': function () {
      // Increase round number
      var game = getCurrentGame();
      Games.update(game._id, {$inc: {round: 1}});
      var players = Players.find({gameID: game._id})
      var round = game.round;
      if (round + 2 > players.count()) {
	  Games.update(game._id, {$set: {state: 'voting'}})
      }
      else {
	  Games.update(game._id, {$set: {state: 'inProgress'}});
      }
		   
      return false;
  }
});

Template.revealView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  messages: function () {
   var game = getCurrentGame();
      var player = getCurrentPlayer();
      console.log(game._id);
      console.log(player._id);
   var messagesArray = Messages.find({gameID: game._id, roundNum: game.round, sendTo: player._id});
   return getMessages(messagesArray);
  },
  isStarting: function() {
    var player = getCurrentPlayer();
    return player.isLeader;
  }
});
