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
    this.resource('participantEstimateResults');
  });
});

SupposeApp.ApplicationRoute = Ember.Route.extend({
  actions: {
    showBecomeHost: function () {
      return this.render('becomeHost', {into: 'participant', outlet: 'modal'});
    },
    closeBecomeHost: function() {
      return this.disconnectOutlet({outlet: 'modal', parentView: 'participant'});
    }
  }
});

SupposeApp.SessionController = Ember.Controller.extend({
  nickname: null,
  isHost: false,
  hasHost: true,
  sessionToken: null,
  participants: Ember.ArrayProxy.create({content: []})
})

SupposeApp.StartSessionController = Ember.Controller.extend({
  needs: 'session',
  nickname: Ember.computed.alias('controllers.session.nickname'),
  isHost: Ember.computed.alias('controllers.session.isHost'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  hostKey: '',
  participants: Ember.computed.alias('controllers.session.participants'),
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
        this.get('participants').set('content', data.participants);
        this.transitionToRoute('participant');
      }.bind(this));
    }
  }
});

SupposeApp.JoinSessionController = Ember.Controller.extend({
  needs: 'session',
  nickname: Ember.computed.alias('controllers.session.nickname'),
  hasHost: Ember.computed.alias('controllers.session.hasHost'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  participants: Ember.computed.alias('controllers.session.participants'),
  actions: {
    joinSession: function() {
      var nickname = this.get('nickname');
      var sessionToken = this.get('sessionToken')

      if(!nickname.trim() || !sessionToken.trim()) {
        return;
      }
      this.socket.connect({});
      this.socket.emit('joinSession', {nickname: nickname, sessionToken: sessionToken}, function(err, data) {
        if(err) {
          //Show something about duplicate nick or missing session.
        } else {
          this.set('hasHost', data.hasHost);
          this.get('participants').set('content', data.participants);
          this.transitionToRoute('participant');
        }
      }.bind(this));
    }
  }
});

SupposeApp.BecomeHostView = Ember.View.extend({
  attributeBindings: ['data-backdrop'],
  'data-backdrop': 'static',
  classNames: ['modal','fade'],
  didInsertElement: function() {
    this.$().modal('show');
  },
  willDestroyElement: function() {
    this.$().modal('hide');
  }
});

SupposeApp.BecomeHostController = Ember.Controller.extend({
  needs: 'session',
  isHost: Ember.computed.alias('controllers.session.isHost'),
  hostKey: null,
  actions: {
    becomeHost: function() {
      var hostKey = this.get('hostKey');
      if (!hostKey.trim()) {
        return;
      }
      this.socket.emit('becomeHost', {hostKey: hostKey}, function(isHost) {
          this.set('isHost', isHost);
          this.send('closeBecomeHost');
          this.transitionToRoute('participant');
      }.bind(this));
    }
  }
})

SupposeApp.ParticipantController = Ember.Controller.extend({
  needs: 'session',
  countdownTimeout: null,
  estimateTimeout: null,
  estimateResults: null,
  isHost: Ember.computed.alias('controllers.session.isHost'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  hasHost: Ember.computed.alias('controllers.session.hasHost'),
  participants: Ember.computed.alias('controllers.session.participants'),
  actions: {
    startCountdown: function () {

    },
    startEstimate: function() {
      this.socket.emit('startEstimate', 10);
    },
    leave: function() {
      this.socket.emit('leave');
      this.set('isHost', false);
      this.set('sessionToken', null);
      this.set('participants', []);
      this.transitionToRoute('index');
    }
  },
  sockets: {
    startCountdown: function(timeout) {
      this.set('countdownTimeout', timeout);
      this.transitionToRoute('participantCountdown');
    },
    startEstimate: function(timeout) {
      this.set('estimateTimeout', timeout);
      this.transitionToRoute('participantEstimate');
    },
    estimateResults: function(results) {
      this.set('estimateResults', results);
      this.transitionToRoute('participantEstimateResults');
    },
    hasHost: function(value) {
      this.set('hasHost', value);
    },
    participantChange: function(changeEvent) {
      if (changeEvent.nickname && changeEvent.changeType) {
        var participants = this.get('participants');
        if (changeEvent.changeType === "joined") {
          participants.addObject(changeEvent.nickname);
        } else if (changeEvent.changeType === "left") {
          participants.removeObject(changeEvent.nickname);
        } else {
          console.log("Unknown changeType: " + data.changeType);
        }
      }
    }
  }
});

SupposeApp.ParticipantEstimateRoute = Ember.Route.extend({
  setupController: function(controller) {
    controller.set('model', ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?' , 'Coffe'])
  }
})

SupposeApp.ParticipantEstimateController = Ember.Controller.extend({
  needs: 'participant',
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

SupposeApp.ParticipantEstimateResultsController = Ember.Controller.extend({
  needs: 'participant'
})
