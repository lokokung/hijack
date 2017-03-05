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

Template.distractView.events({
    'submit #random-question': function (event) {
	event.preventDefault();
    var answer = event.target.playerAnswer.value;

    if (!answer) {
      return false;
    } else {
      // Session.set("currentView", "startMenu");
    }
  }
});

Template.distractView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  question: function () {
    return "Lorem Ipsum is simply dummy text of the \
            printing and typesetting industry. Lorem \
            Ipsum has been the industry's standard dummy \
            text ever since the 1500s, when an unknown \
            printer took a galley of type and scrambled \
            it to make a type specimen book. It has \
            survived not only five centuries, but also the \
            leap into electronic typesetting, remaining \
            essentially unchanged. It was popularised in \
            the 1960s with the release of Letraset sheets \
            containing Lorem Ipsum passages, and more \
            recently with desktop publishing software like \
            Aldus PageMaker including versions of Lorem Ipsum."
  }/*,
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
  } */
});
