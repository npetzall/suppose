var EstimateAggregator = require('./EstimateAggregator');

module.exports = PlanningSession;

function PlanningSession(participant, hostKey, sessionToken, socketio) {
  if(!(this instanceof PlanningSession)) {
    return new PlanningSession(participant, hostKey, sessionToken, socketio);
  }

  this.host = participant;
  this.hostKey = hostKey;
  this.sessionToken = sessionToken;
  this.socketio = socketio;

  this.participants = new Map();

  this.estimateAggregator = EstimateAggregator(this.onEstimatesCollected.bind(this));

  this.addParticipant(participant);
  this.sessionStart = Date.now();
};

PlanningSession.prototype.isHost = function(participant) {
  return this.host.id === participant.id;
};

PlanningSession.prototype.hasHost = function() {
  return this.host != null;
};

PlanningSession.prototype.setNewHost = function(participant, hostKey) {
  if (this.host == null) {
    if(this.hostKey === hostKey) {
      this.host = participant;
      this.onHostChange(false);
      return true;
    }
  }
  return false;
};

PlanningSession.prototype.isNicknameAvaliable = function(nickname) {
  return !this.participants.has(nickname);
};

PlanningSession.prototype.addParticipant = function(participant) {
  participant.sessionToken = this.sessionToken;
  this.participants.set(participant.nickname, participant);
  this.estimateAggregator.oneJoined(participant.nickname);
  this.onParticipantChange(participant.nickname, "joined");
  return participant;
};

PlanningSession.prototype.removeParticipant = function(participant) {
  if(this.isHost(participant)) {
    this.host=null;
    this.onHostChange(true);
  }
  /*var index = this.participants.length
  while(index > 0) {
    index--;
    if (this.participants[index] === participant) {
      var participant = this.participants[index];
      this.participants.splice(index,1);
      this.estimateAggregator.oneLeft(participant.nickname);
      this.onParticipantChange(participant.nickname, "left");
      return;
    }
  }*/
  var removed = this.participants.delete(participant.nickname);
  if (removed) {
    this.estimateAggregator.oneLeft(removed.nickname);
    this.onParticipantChange(removed.nickname, "left");
  }
};

PlanningSession.prototype.isEstimating = function() {
  return this.estimateAggregator.isEstimating();
}

PlanningSession.prototype.startEstimating = function(timeout) {
  this.estimateAggregator.start(timeout);
};

PlanningSession.prototype.registerEstimate = function(participant, estimate, fn) {
  this.estimateAggregator.registerEstimate(participant, estimate, fn);
}

//Socket.io Events

PlanningSession.prototype.onHostChange = function(noHost) {
  this.socketio.to(this.sessionToken).emit('noHost', noHost);
}

PlanningSession.prototype.onParticipantChange = function(nickname, changeType) {
  this.socketio.to(this.sessionToken).emit('participantChange', {nickname: nickname, changeType: changeType});
}

PlanningSession.prototype.onEstimatesCollected = function(results) {
  console.log("Sending results");
  this.socketio.to(this.sessionToken).emit('estimateResults', results);
}
