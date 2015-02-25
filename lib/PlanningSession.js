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
  if (this.host) {
    return this.host.id === participant.id;
  }
  return false;
};

PlanningSession.prototype.hasHost = function() {
  return this.host != null;
};

PlanningSession.prototype.setNewHost = function(participant, hostKey) {
  if (this.host == null) {
    if(this.hostKey === hostKey) {
      console.log(participant.nickname + " is new host in " + this.sessionToken);
      this.host = participant;
      this.onHostChange(this.hasHost());
      return true;
    }
  }
  return false;
};

PlanningSession.prototype.isNicknameAvaliable = function(nickname) {
  return !this.participants.has(nickname);
};

PlanningSession.prototype.addParticipant = function(participant) {
  this.participants.set(participant.nickname, participant);
  this.estimateAggregator.oneJoined(participant.nickname);
  this.onParticipantChange(participant.nickname, "joined");
};

PlanningSession.prototype.removeParticipant = function(participant) {
  if(this.isHost(participant)) {
    this.host=null;
    this.onHostChange(this.hasHost());
  }
  if (this.participants.delete(participant.nickname)) {
    this.estimateAggregator.oneLeft(participant.nickname);
    this.onParticipantChange(participant.nickname, "left");
  }
};

PlanningSession.prototype.getParticipantNicknames = function() {
  var nicknames = [];
  this.participants.forEach(function(value, key, map) {
    nicknames.push(key);
  });
  return nicknames;
}

PlanningSession.prototype.isEstimating = function() {
  return this.estimateAggregator.isEstimating();
};

PlanningSession.prototype.startEstimating = function(timeout) {
  this.estimateAggregator.start(timeout);
};

PlanningSession.prototype.registerEstimate = function(participant, estimate, fn) {
  this.estimateAggregator.registerEstimate(participant, estimate, fn);
}

//Socket.io Events

PlanningSession.prototype.onHostChange = function(hasHost) {
  this.socketio.to(this.sessionToken).emit('hasHost', hasHost);
}

PlanningSession.prototype.onParticipantChange = function(nickname, changeType) {
  this.socketio.to(this.sessionToken).emit('participantChange', {nickname: nickname, changeType: changeType});
}

PlanningSession.prototype.onEstimatesCollected = function(results) {
  console.log("Sending results");
  this.socketio.to(this.sessionToken).emit('estimateResults', results);
}
