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
  return this.planningSessions.get(sessionToken);
}

PlanningSessionStore.prototype.reap = function() {
  console.log("Start reaping, current number of PlanningSessions: " + this.planningSessions.size);
  var removed = 0;
  var threshold = Date.now() - (8*60*60*1000) - (10*60*10000);
  var oldestPlanningSession = Date.now();

  for (var entry of this.planningSessions.entries()) {
    if (entry[1].sessionStart < threshold) {
      if (this.planningSessions.delete(entry[0])) {
        removed += 1;
      }
    } else {
      oldestPlanningSession = Math.min(entry[1].sessionStart, oldestPlanningSession);
    }
  }
  console.log("Finised reaping, removed: " + removed + " and will reap again in: " + (oldestPlanningSession - threshold));
  setTimeout(this.reap.bind(this), oldestPlanningSession - threshold).unref();
}
