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
  for (var i = 0; i < messagesArray.length; i++) {
    var fromPlayer = Players.findOne(messagesArray[i].sendFrom);
    var toPlayer = Players.findOne(messagesArray[i].sendTo);

    var message = { id: i, message: messagesArray[i].msgContent, 
                    from: fromPlayer.name, to: toPlayer.name, active: false };
    messages.push(message);
  }
}

function setButtonActive(id) {
  var inputId = "message-" + id;

  for (var i = 0; i < messages.length; i++) {
    console.log(id);
    if (messages[i].id != id) {
      messages[i].active = false;
      document.getElementById(inputId).value = messages[i].message;
    } else {
      messages[i].active = true;
    }
  }
}

var messages = null;

Template.hijackView.events({
  'submit': function (event) {
    Session.set("currentView", "startMenu"); // TEST
    var inputId = "message-" + this.id;
    var newMessage = document.getElementById(inputId).value;

    // Update Messages 
    
    Session.set("currentView", "startMenu");
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
      Session.set("currentView", "startMenu");
    } 

    return moment(timeRemaining).format('mm[<span>:</span>]ss');
  },
  gameFinished: function () {
    var timeRemaining = getTimeRemaining();

    return timeRemaining === 0;
  },
  messages: function () {
    var msg1 = { message: 'hello', from: 'me', to: 'you', id: '050', active: false};
    var msg2 = { message: 'hi', from: 'you', to: 'me', id: '1', active: false};
    messages = [msg1, msg2];
    return messages;

    // var game = getCurrentGame();
    // var messagesArray = Messages.find({gameID: game._id, roundNum: game.round});
    // getMessages(messagesArray);
    // return messages;
  }
});