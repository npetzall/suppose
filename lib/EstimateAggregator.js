var EstimateResult = require('./EstimateResult');

module.exports = EstimateAggregator;

const NO_ESTIMATE = 'No Estimate';

function EstimateAggregator(onEstimatesCollected) {

  if(!(this instanceof EstimateAggregator)) {
    return new EstimateAggregator(onEstimatesCollected);
  }

  this.onEstimatesCollected = onEstimatesCollected;
  this.timeoutRef = null;

  this.estimates = new Map();

  this.expectedEstimates = 0;
  this.receivedEstimates = 0;

}

EstimateAggregator.prototype.isEstimating = function() {
  return this.timeoutRef != null;
}

EstimateAggregator.prototype.oneJoined = function(nickname) {
  this.estimates.set(nickname, NO_ESTIMATE);
  this.expectedEstimates++;
}

EstimateAggregator.prototype.oneLeft = function(nickname) {
  if (this.estimates.has(nickname)) {
    if (this.estimates.get(nickname) != NO_ESTIMATE) {
      this.receivedEstimates--;
    }
    this.estimates.delete(nickname);
    this.expectedEstimates--;
  }
}

EstimateAggregator.prototype.start = function(timeout) {
  for (var nickname of this.estimates.keys()) {
    this.estimates.set(nickname, NO_ESTIMATE);
  }
  this.timeoutRef = setTimeout(this.finish.bind(this), timeout * 1000);
  this.receivedEstimates = 0;
}

EstimateAggregator.prototype.registerEstimate = function(participant, estimate, fn) {
  if (this.estimates.get(participant.nickname) === NO_ESTIMATE) {
    console.log("recevied estimate in: " + participant.sessionToken + " from: " + participant.nickname);
    this.estimates.set(participant.nickname, estimate);
    this.receivedEstimates++;
    if (this.expectedEstimates === this.receivedEstimates) {
      console.log("All estimates received");
      fn();
      this.finish();
    } else {
      fn();
    }
  } else {
    fn({error:"AlreadyEstimated", description:"Estimate is already registered"});
  }
}

EstimateAggregator.prototype.finish = function() {
  clearTimeout(this.timeoutRef);
  console.log("Finishing estimation round");
  this.onEstimatesCollected(EstimateResult(this.estimates));
  this.timeoutRef = null;
}
