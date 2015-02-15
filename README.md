# suppose
SUPPOSE - ScrUm Planning POker SystEm

Simple system to host Scrum Planning Poker online.

Host of the sprint planning will start a planning session on the website using a nickname and receive a 4 digit code. The code is valid for 10 hours.

Members of the scrum team that are present at the planning will be able to join the planning session by supplying a nickname and the 4 digit code.

## Host view  
* It's possible to starta a discussion timer, which will notify when it should be time to do the estimates.
* It's possible to starta a estimate round with a time limit (unanswered responses are marked as ?)
* Ability to review participants and exclude or invalidate responses from certain participants.

## Participants view
* Will see countdown timer if discussion timer has been set by host. (not updated by server so some mismatch may occure).
* Will be able during the estimate round to select one of following estimates: 0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100, ? and CoffeCup.

## Result view
* Will be shown after all participants have entered an estimate.
* Shows what each participant has answered.
* Bargraph showing the spread.
* Median and avg estimate.
* Is shown until host starts a discussion timer or a new round of estimates.
