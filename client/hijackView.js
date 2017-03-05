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

function getTimeRemaining(){
  var game = getCurrentGame();
  var localEndTime = game.endTime - TimeSync.serverOffset();
  var timeRemaining = localEndTime - Session.get('time');

  if (timeRemaining < 0) {
    timeRemaining = 0;
  }

  return timeRemaining;
}

function getMessages(messagesArray) {
    messages = [];
    messagesArray.forEach( function(msg, index) {
	var fromPlayer = Players.findOne(msg.sendFrom);
	var toPlayer = Players.findOne(msg.sendTo);

	var message = { id: msg._id, message: msg.msgContent, 
			from: fromPlayer.name, to: toPlayer.name };
	messages.push(message);
    });

    return messages;
}

function setButtonActive(id) {
  for (var i = 0; i < messages.length; i++) {
    var inputId1 = "message-" + messages[i].id;
    var inputId2 = 'btn-' + messages[i].id;

    if (messages[i].id != id) {
      document.getElementById(inputId1).value = messages[i].message;
      document.getElementById(inputId2).style.display = "none";
    } else {
      document.getElementById(inputId2).style.display = "inline";
    }
  }
}

var messages = null;

Template.hijackView.events({
  'submit': function (event) {
    var inputId = "message-" + this.id;
    var newMessage = document.getElementById(inputId).value;

    // Update Messages 
      console.log(newMessage);
      event.preventDefault();
      console.log(this.id);
      Messages.update(this.id, {$set: {msgContent: newMessage}});
      Games.update(Session.get("gameID"), {$set: {state: 'revealMsg'}});
      Session.set("currentView", "revealView");
  },
  'click .messages-input': function () {
    setButtonActive(this.id);
  },
});

Template.hijackView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  timeRemaining: function () {
    var timeRemaining = getTimeRemaining();

    if (timeRemaining <= 0) {
      // Session.set("currentView", "startMenu");
    } 

    return moment(timeRemaining).format('mm[<span>:</span>]ss');
  },
  gameFinished: function () {
    var timeRemaining = getTimeRemaining();

    return timeRemaining === 0;
  },
  messages: function () {
    // var msg1 = { message: 'hello', from: 'me', to: 'you', id: '050'};
    // var msg2 = { message: 'hi', from: 'you', to: 'me', id: '1'};
    // messages = [msg1, msg2];
    // return messages;

    var game = getCurrentGame();
    var messagesArray = Messages.find({gameID: game._id, roundNum: game.round});
    getMessages(messagesArray);
    return messages;
  }
});
