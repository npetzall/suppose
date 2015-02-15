var PlanningSession = require('./PlanningSession');

module.exports = PlanningSessionStore;

function PlanningSessionStore(socketio) {
  if(!(this instanceof PlanningSessionStore)) {
    return new PlanningSessionStore(socketio);
  }

  this.socketio = socketio;

  this.seed = 1;

  this.planningSessions = new Map();

  this.reap();

};

PlanningSessionStore.prototype.createSessionToken = function() {
  do {
    var x = Math.sin(this.seed++) * 10000;
    var token = ""+((x - Math.floor(x)) * 10000).toFixed(0);
    if (token.length > 4) {

    }
    while(token.lenght < 4) {
      token = "0" + token;
    }
  } while(this.planningSessions.has(token));
  return token;
}

PlanningSessionStore.prototype.createPlanningSession = function(participant, data) {
  var sessionToken = this.createSessionToken();
  participant.sessionToken = sessionToken;
  participant.nickname = data.nickname;
  this.planningSessions.set(sessionToken, PlanningSession(participant, data.hostKey, sessionToken, this.socketio))
  return participant;
}

PlanningSessionStore.prototype.getPlanningSession = function(sessionToken) {
  /*var index = planningSessions.length;
  while(index > 0) {
    index --;
    if (planningSessions[index].sessionToken == sessionToken) {
      return planningSessions[index];
    }
    return null;
  }*/
  return this.planningSessions.get(sessionToken);
}

PlanningSessionStore.prototype.reap = function() {
  var threshold = Date.now() - (8*60*60*1000) - (10*60*10000);
  var oldestPlanningSession = Date.now();
  /*var index = this.planningSessions.length;
  while(index > 0) {
    index--
    if (this.planningSessions[index].sessionStart < threshold) {
      var removed = this.planningSession.splice(index, 1);
      if (removed.length == 1) {
        usedTokens[removed[0].sessionToken] = false;
      }
    } else {
      oldestPlanningSession = Math.min(this.planningSessions[index].sessionStart, oldestPlanningSession);
    }
  }*/
  for (var entry of this.planningSessions.entries()) {
    if (entry[1].sessionStart < threshold) {
      this.planningSessions.delete(entry[0]);
    } else {
      oldestPlanningSession = Math.min(entry[1].sessionStart, oldestPlanningSession);
    }
  }
  setTimeout(this.reap, oldestPlanningSession - threshold).unref();
}
