# 07. Blind Judging

## 1. Double-Blind Judging (BR-12)

The judging process must protect participant identity throughout the judging phase.

Before returning submission data to a Judge, the backend must remove personal identifying information, including:

- Participant name
- Email address
- Profile picture or avatar
- Other fields that can directly identify the participant

The Judge response should contain only the submission information needed for evaluation, such as the submission code, photograph, title, artistic statement, and relevant technical metadata.

Identity protection must be enforced at the backend response/DTO layer. Hiding personal information only in the user interface is not sufficient.

## 2. Judge Independence (BR-13)

Judges must evaluate submissions independently.

- A Judge must not view another Judge's scores or comments for the same submission while the judging round remains open.
- The system must enforce this restriction in backend authorization and data access, not only in the user interface.
- Scores and comments from other judges may become available only after the official judging round closes, according to BR-13.

## 3. Score Discrepancy Detection (BR-14)

The system must compare the total scores assigned by judges to the same submission.

Let:

- \(S_{max}\) be the highest total score.
- \(S_{min}\) be the lowest total score.
- \(S_{scale}\) be the maximum possible total score.

The score difference is:

\[
\Delta S = S_{max} - S_{min}
\]

A discrepancy must be flagged when:

\[
\Delta S > 0.30 \times S_{scale}
\]

When the threshold is exceeded:

1. Mark the submission with `DISCREPANCY_CONFLICT`.
2. Notify or alert the Contest Organizer or Head Judge for coordination.
3. Require the discrepancy to be addressed before final results are confirmed.

A difference equal to exactly 30% does not exceed the threshold and therefore does not trigger this rule.

## 4. Individual Scorecard Closure and Final Scoring (BR-25)

The judging process must distinguish between an individual Judge's submitted scorecard and the final score calculated from assigned judges' evaluations.

According to BR-25:

- Calculate the final score as the average of the assigned judges' total scores.
- Round the final score to two decimal places.

For \(n\) assigned judges, the calculation is:

\[
S_{final} = \operatorname{round}\left(
\frac{\sum_{j=1}^{n} S_j}{n}, 2
\right)
\]

Where \(S_j\) is the total score submitted by Judge \(j\).

The judging round must close before judges can view other judges' scores and comments, as required by BR-13. Any score discrepancy flagged under BR-14 must be handled before final results are confirmed.

**Clarification required:** The SRS defines the final-score calculation and the restriction on viewing other judges' scores before the round closes. The exact action that locks an individual scorecard, and whether a submitted scorecard can be reopened, should be confirmed with the team rather than assumed.

## 5. Related Business Rules

| Rule | Requirement |
|---|---|
| BR-12 | Protect participant identity throughout double-blind judging. |
| BR-13 | Prevent judges from viewing other judges' scores and comments before the judging round closes. |
| BR-14 | Flag `DISCREPANCY_CONFLICT` when the difference between the highest and lowest total scores exceeds 30% of the scoring scale. |
| BR-25 | Calculate the average of assigned judges' total scores and round to two decimal places. |
