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
    this.resource('participantBreak');
  });
});

SupposeApp.ApplicationRoute = Ember.Route.extend({
  actions: {
    showDialog: function (dialogName) {
      return this.render(dialogName, {
        into: 'application',
        outlet: 'dialog',
        view: 'dialog',
        controller: dialogName
        });
    },
    closeDialog: function() {
      return this.disconnectOutlet({outlet: 'dialog', parentView: 'application'});
    }
  }
});

SupposeApp.DialogView = Ember.View.extend({
  attributeBindings: ['data-backdrop'],
  'data-backdrop': 'static',
  classNames: ['modal','fade'],
  didInsertElement: function() {
    this.$().modal('show');
    setTimeout(function(){
      this.$(":input").first()[0].focus();;
    }.bind(this), 500);

  },
  willDestroyElement: function() {
    this.$().modal('hide');
  }
});

SupposeApp.SupposeDialogComponent = Ember.Component.extend({
  actions: {
    closeDialog: function() {
      return this.sendAction();
    }
  }
});

SupposeApp.SessionController = Ember.Controller.extend({
  nickname: '',
  isHost: false,
  hasHost: true,
  sessionToken: '',
  participants: Ember.ArrayProxy.create({content: []}),
  noWantsBreak: 0,
  wantsBreak: false
});

SupposeApp.CreatePlanningSessionController = Ember.Controller.extend({
  needs: 'session',
  nickname: Ember.computed.alias('controllers.session.nickname'),
  isHost: Ember.computed.alias('controllers.session.isHost'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  hostKey: '',
  participants: Ember.computed.alias('controllers.session.participants'),
  noWantsBreak: Ember.computed.alias('controllers.session.noWantsBreak'),
  actions: {
    createSession: function() {
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
        this.set('noWantsBreak', data.noWantsBreak);
        this.send('closeDialog');
        this.transitionToRoute('participant');
      }.bind(this));
    }
  }
});

SupposeApp.JoinPlanningSessionController = Ember.Controller.extend({
  needs: 'session',
  nickname: Ember.computed.alias('controllers.session.nickname'),
  hasHost: Ember.computed.alias('controllers.session.hasHost'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  participants: Ember.computed.alias('controllers.session.participants'),
  noWantsBreak: Ember.computed.alias('controllers.session.noWantsBreak'),
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
          this.set('noWantsBreak', data.noWantsBreak);
          this.send('closeDialog');
          this.transitionToRoute('participant');
        }
      }.bind(this));
    }
  }
});

SupposeApp.ParticipantController = Ember.Controller.extend({
  needs: 'session',
  idleTimeout: '',
  estimateTimeout: '',
  estimateResults: null,
  breakTimeout: '',
  isHost: Ember.computed.alias('controllers.session.isHost'),
  sessionToken: Ember.computed.alias('controllers.session.sessionToken'),
  hasHost: Ember.computed.alias('controllers.session.hasHost'),
  participants: Ember.computed.alias('controllers.session.participants'),
  noWantsBreak: Ember.computed.alias('controllers.session.noWantsBreak'),
  wantsBreak: Ember.computed.alias('controllers.session.wantsBreak'),
  actions: {
    startEstimate: function() {
      this.socket.emit('startEstimate', 10);
    },
    requestBreak: function() {
      var wantsBreak = this.get('wantsBreak');
      this.socket.emit('requestBreak', !wantsBreak);
      this.set('wantsBreak', !wantsBreak);
    },
    leave: function() {
      this.socket.emit('leave');
      this.set('isHost', false);
      this.set('sessionToken', null);
      this.get('participants').clear();
      this.set('noWantsBreak',0);
      this.set('wantsBreak', false);
      this.transitionToRoute('index');
    }
  },
  sockets: {
    startCountdown: function(timeout) {
      this.set('idleTimeout', timeout);
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
    },
    requestBreakUpdate: function(noWantsBreak) {
      this.set('noWantsBreak', noWantsBreak);
    },
    haveBreak: function(timeout) {
      this.set('wantsBreak', false);
      this.set('noWantsBreak',0);
      this.set('breakTimeout', timeout);
      this.transitionToRoute('participantBreak');
    }
  }
});

SupposeApp.CountdownController = Ember.Controller.extend({
  needs: 'participant',
  idleTimeout: Ember.computed.alias('controllers.participant.idleTimeout'),
  actions:{
    startCountdown: function () {
      var idleTimeout = this.get('idleTimeout');

      if (!idleTimeout && !idleTimeout.trim()) {
        return;
      }

      this.socket.emit('startCountdown', parseInt(idleTimeout));
      this.send('closeDialog');
    }
  }
});

SupposeApp.StartEstimationRoundController = Ember.Controller.extend({
  needs: 'participant',
  estimateTimeout: Ember.computed.alias('controllers.participant.estimateTimeout'),
  actions: {
    startEstimationRound: function() {
      var estimateTimeout = this.get('estimateTimeout');

      if (!estimateTimeout && !estimateTimeout.trim()) {
        return;
      }

      this.socket.emit('startEstimationRound', parseInt(estimateTimeout));
      this.send('closeDialog');
    }
  }
});

SupposeApp.ParticipantCountdownController = Ember.Controller.extend({
  needs: 'participant'
});

SupposeApp.ParticipantEstimateRoute = Ember.Route.extend({
  setupController: function(controller) {
    controller.set('model', ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?' , 'Coffe'])
  }
});

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
});

SupposeApp.ParticipantEstimateResultsController = Ember.Controller.extend({
  needs: 'participant'
});

SupposeApp.BecomeHostController = Ember.Controller.extend({
  needs: 'session',
  isHost: Ember.computed.alias('controllers.session.isHost'),
  hostKey: '',
  actions: {
    becomeHost: function() {
      var hostKey = this.get('hostKey');
      if (!hostKey.trim()) {
        return;
      }
      this.socket.emit('becomeHost', {hostKey: hostKey}, function(isHost) {
          this.set('isHost', isHost);
          this.send('closeDialog');
          this.transitionToRoute('participant');
      }.bind(this));
    }
  }
});

SupposeApp.HaveBreakController = Ember.Controller.extend({
  needs: 'participant',
  breakTimeout: Ember.computed.alias('controllers.participant.breakTimeout'),
  actions: {
    haveBreak: function() {
      var breakTimeout = this.get('breakTimeout');
      if (!breakTimeout && !breakTimeout.trim()) {
        return;
      }
      this.socket.emit('haveBreak', parseInt(breakTimeout));
      this.send('closeDialog');
    }
  }
});

SupposeApp.ParticipantBreakController = Ember.Controller.extend({
  needs: 'participant'
});
