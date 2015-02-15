window.SupposeApp = Ember.Application.create({

    Socket: EmberSockets.extend({
      controllers: ['startSession','joinSession','participant'],
      autoConnect: false
    })
});

SupposeApp.Router.map(function () {
  this.resource('startSession');
  this.resource('joinSession');
  this.resource('participant', function() {
    this.resource('participantCountdown');
    this.resource('participantEstimate');
    this.resource('participantEstimateResult');
  });
});

SupposeApp.SessionController = Ember.Controller.extend({
  nickname: null,
  isHost: false,
  sessionToken: null
})

SupposeApp.StartSessionController = Ember.Controller.extend({
  needs: 'session',
  nickname: Ember.computed.alias('controllers.session.nickname'),
  isHost: Ember.computed.alias('controllers.session.isHost'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  hostKey: '',
  actions: {
    startSession: function() {
      var nickname = this.get('nickname');
      var hostKey = this.get('hostKey');

      if(!nickname.trim() || !hostKey.trim()) {
        return;
      }
      this.socket.connect({});
      this.socket.emit('startSession', {nickname: nickname, hostKey: hostKey}, function(data) {
        this.set('isHost', data.isHost);
        this.set('sessionToken', data.sessionToken);
        this.transitionToRoute('participant');
      }.bind(this));
    }
  }
});

SupposeApp.JoinSessionController = Ember.Controller.extend({
  needs: 'session',
  nickname: Ember.computed.alias('controllers.session.nickname'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  actions: {
    joinSession: function() {
      var nickname = this.get('nickname');
      var sessionToken = this.get('sessionToken')

      if(!nickname.trim() || !sessionToken.trim()) {
        return;
      }
      this.socket.connect({});
      this.socket.emit('joinSession', {nickname: nickname, sessionToken: sessionToken}, function(err) {
        if(err) {
          //Show something about duplicate nick or missing session.
        } else {
          this.transitionToRoute('participant');
        }
      }.bind(this));
    }
  }
});

SupposeApp.ParticipantController = Ember.Controller.extend({
  needs: 'session',
  noHost: false,
  actions: {
    startCountdown: function () {

    },
    startEstimate: function() {
      this.socket.emit('startEstimate', 10);
    }
  },
  sockets: {
    startCountdown: function(duration) {
      this.transitionToRoute('participantCountdown');
    },
    startEstimate: function(duration) {
      this.transitionToRoute('participantEstimate');
    },
    showResults: function(results) {
      this.transitionToRoute('participantEstimateResults');
    },
    noHost: function(value) {
      this.set('noHost', value);
    }
  }
});

SupposeApp.ParticipantEstimateRoute = Ember.Route.extend({
  setupController: function(controller) {
    controller.set('model', ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?' , 'Coffe'])
  }
})

SupposeApp.ParticipantEstimateController = Ember.Controller.extend({
  actions: {
    estimate: function(val) {
      this.socket.emit('estimate', val, function(err) {
        if(err) {
          console.log(err);
        } else {
          this.transitionToRoute('participant');
        }
      }.bind(this));
    }
  }
})
