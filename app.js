var http = require('http');
var socketio = require('socket.io');
var serveStatic = require('serve-static');
var finalhandler = require('finalhandler');

var serve = serveStatic(__dirname + '/static');
var server = http.createServer(function(req,res) {
  var done=finalhandler(req,res);
  serve(req,res,done);
});
var io = socketio(server);

var planningSessionStore = require('./lib/PlanningSessionStore')(io);
var users = {};

io.on('connection', function (socket) {
      console.log("Connected: " + socket.id);
      users[socket.id] = { id: socket.id };
    socket.on('startSession', function(data, fn) {
      users[socket.id] = planningSessionStore.createPlanningSession(users[socket.id], data);
      var sessionToken = users[socket.id].sessionToken;
      socket.join(sessionToken);
      fn({isHost:true, sessionToken: sessionToken, participants: [users[socket.id].nickname] });
      console.log("Planning session: " + sessionToken +  " started by: " + users[socket.id].nickname);
    });
    socket.on('joinSession', function(data, fn) {
      var planningSession = planningSessionStore.getPlanningSession(data.sessionToken);
      if (planningSession) {
        if (planningSession.isNicknameAvaliable(data.nickname)) {
          users[socket.id].sessionToken = data.sessionToken;
          users[socket.id].nickname = data.nickname;
          planningSession.addParticipant(users[socket.id]);
          socket.join(planningSession.sessionToken);
          fn(null, { hasHost:planningSession.hasHost(), participants: planningSession.getParticipantNicknames() });
          console.log("Connection: " + socket.id + "/" + data.nickname + " joined planning session with token: " + data.sessionToken);
        } else {
          fn({error: "nicknameInUser", msg:"The nickname you have entered is already in use, enter another nickname"})
          console.log("Connection: " + socket.id + "/" + data.nickname + " nickname is in use");
        }
      } else {
        fn({error: "noPlanningSession", msg:"The planning session has expired or does not exists, enter another session token"})
        console.log("Connection: " + socket.id + "/" + data.nickname + " tried to access planning session with token: " + data.sessionToken + " which doesnt exist");
      }
    });
    socket.on('startCountdown', function(idleTimeout){
      var planningSession = planningSessionStore.getPlanningSession(users[socket.id].sessionToken);
      if (planningSession) {
        if (planningSession.isHost(users[socket.id])) {
          io.to(planningSession.sessionToken).emit('startCountdown', idleTimeout);
          console.log("Starting "+ idleTimeout +" minute Countdown in session: " + planningSession.sessionToken);
        } else {
          console.log("Connection: " + socket.id + "/" + users[socket.id].nickname + " tried to start a countdown in planning session: "+planningSession.sessionToken+" but is not the host");
        }
      } else {
        console.log("Connection: " + socket.id + "/" + users[socket.id].nickname + " tried to start a countdown in planning session: " + users[socket.id].sessionToken + "which does not exist");
      }
    });
    socket.on('startEstimationRound', function(data) {
      var planningSession = planningSessionStore.getPlanningSession(users[socket.id].sessionToken);
      if (planningSession) {
        if (planningSession.isHost(users[socket.id])) {
          planningSession.startEstimating(data);
          io.to(planningSession.sessionToken).emit('startEstimate', data);
          console.log("Starting Estimation round in session: " + planningSession.sessionToken);
        } else {
          console.log("Connection: " + socket.id + "/" + users[socket.id].nickname + " tried to start an estimation round in planning session: "+planningSession.sessionToken+" but is not the host");
        }
      } else {
        console.log("Connection: " + socket.id + "/" + users[socket.id].nickname + " tried to start an estimation round in planning session: " + users[socket.id].sessionToken + "which does not exist");
      }
    });
    socket.on('estimate', function(estimate, fn) {
      var planningSession = planningSessionStore.getPlanningSession(users[socket.id].sessionToken);
      if (planningSession) {
        planningSession.registerEstimate(users[socket.id], estimate, fn);
      } else {
        fn({error: "noPlanningSession", msg:"The planning session has expired or does not exists"})
        console.log("Connection: " + socket.id + "/" + users[socket.id].nickname + " tried to make an estimate in planning session with token: " + users[socket.id].sessionToken + " which does not exist");
      }
    });
    socket.on('becomeHost', function(data, fn) {
      if (data || data.hostKey) {
        var planningSession = planningSessionStore.getPlanningSession(users[socket.id].sessionToken);
        if (planningSession) {
          fn(planningSession.setNewHost(users[socket.id], data.hostKey));
        } else {
          fn(false);
        }
      } else {
        fn(false);
      }
    });
    socket.on('leave', function() {
      if (users[socket.id].sessionToken) {
        var planningSession = planningSessionStore.getPlanningSession(users[socket.id].sessionToken);
        if (planningSession) {
          planningSession.removeParticipant(users[socket.id]);
          console.log("Connection: " + socket.id + "/" + users[socket.id].nickname + " left planning session with token: " + planningSession.sessionToken);
        } else {
          console.log("Connection: " + socket.id + "/" + users[socket.id].nickname + " tried to leave planning session with token: " + users[socket.id].sessionToken + " which does not exist");
        }
        delete users[socket.id].sessionToken;
      } else {
        console.log("Connection: " + socket.id + " tried to leave planning session but user doesn't have a sessionToken");
      }
    });
    socket.on('disconnect', function() {
      if (users[socket.id].sessionToken) {
        planningSession = planningSessionStore.getPlanningSession(users[socket.id].sessionToken);
        if (planningSession) {
          planningSession.removeParticipant(users[socket.id]);
        }
      }
      delete users[socket.id];
      console.log("Disconnected: " + socket.id);
    });
});

server.listen(8881);
console.log("Listening on port: 8881");
