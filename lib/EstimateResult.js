module.exports = EstimateResult;

function EstimateResult(mapResult) {

  if(!(this instanceof EstimateResult)) {
    return new EstimateResult(mapResult);
  }

  this.estimates = [];
  this.estimateValues = [];
  this.frequency = {};

  for (var entry of mapResult.entries()) {
    this.estimates.push({nickname: entry[0], estimate: entry[1]});
    if(this.frequency.hasOwnProperty(entry[1])) {
      this.frequency[entry[1]] += 1;
    } else {
      this.frequency[entry[1]] = 1;
    }
    if (entry[1] != '?') {
      if (entry[1] == '½') {
        this.estimateValues.push(0.5);
      } else {
        this.estimateValues.push(parseInt(entry[1]));
      }
    }
  }

  this.estimateValues.sort(function(a,b) { return a-b});

  this.low = this.estimateValues[0] === '0.5' ? '½': this.estimateValues[0] ;
  this.high = this.estimateValues[this.estimateValues.length -1] === '0.5' ? '½' : this.estimateValues[this.estimateValues.length -1] ;

  var total = 0;

  for (var value of this.estimateValues) {
    total += value;
  }

  this.average = total / this.estimateValues.length;

  if (this.estimateValues.length % 2 == 0) {
    var middle = this.estimateValues.length / 2;
    this.median = (parseInt(this.estimateValues[middle-1]) + parseInt(this.estimateValues[middle])) / 2;
  } else {
    var middle = this.estimateValues.length / 2;
    this.median = (this.estimateValues[Math.floor(middle)]);
  }

}
