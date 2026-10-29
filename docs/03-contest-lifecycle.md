# 03. Contest Lifecycle

## 1. Contest State Machine

The contest lifecycle follows the state order defined in FPC-128:

`DRAFT` -> `OPEN` -> `UNDER_REVIEW` -> `JUDGING` -> `PUBLISHED` -> `ARCHIVED`

| State | Description |
|---|---|
| `DRAFT` | The organizer creates and configures the contest. |
| `OPEN` | The contest is open for participant registration and submissions within the configured period. |
| `UNDER_REVIEW` | The organizer reviews submissions and their required verification evidence. |
| `JUDGING` | Assigned judges evaluate eligible submissions using the configured scoring criteria. |
| `PUBLISHED` | The official contest results are published. Published results must not be changed (BR-16). |
| `ARCHIVED` | The completed contest is retained in the archive. |

The system must prevent invalid state transitions and follow the defined lifecycle order.

The detailed triggers for entering `UNDER_REVIEW` and `ARCHIVED` are not fully specified by the referenced requirements and should be confirmed with the team.

## 2. Contest Schedule (BR-08)

FPC-128 specifies the following chronological order:

`Registration Start < Submission Deadline < Judging Start < Judging Deadline < Published`

Each milestone must occur strictly after the previous milestone. Equal or incorrectly ordered timestamps are invalid.

The system must validate the schedule and reject invalid configurations with a clear validation message.

After the submission deadline, new submissions and submission edits must be locked according to BR-08. Participants may edit or withdraw submissions only within the permitted period and not after judging starts (BR-24).

**SRS clarification:** The contest setup section of the SRS describes four milestones:

`Registration Start < Submission Deadline < Judging Deadline < Result Publication Date`

It does not explicitly list `Judging Start` as a separate field in that section. The additional milestone specified by FPC-128 should be confirmed with the team so the documentation remains consistent with the approved requirements.

## 3. Categories and Scoring Criteria (BR-15)

The organizer configures contest categories and the scoring criteria for each category.

Examples of scoring criteria in the SRS include:

- Composition and creativity
- Exposure technique
- Tone and film grain
- Story

The organizer can configure the maximum number of submissions allowed per participant for each category. The contest configuration also defines whether negative proof is required at submission time or only for finalists, subject to BR-06.

### Scoring weight validation

For each category, the sum of all scoring criterion weights must equal exactly 100%.

\[
\sum_{i=1}^{n} w_i = 100\%
\]

Where:
- \(w_i\) is the percentage weight assigned to criterion \(i\).
- \(n\) is the number of scoring criteria in the category.

The system must reject a scoring configuration if the total weight is less than or greater than 100%, and provide a clear validation message.

The weighted score is calculated using the configured criterion weights, as specified by BR-15.

## 4. Related Business Rules

| Rule | Requirement |
|---|---|
| BR-06 | Finalists and winners must have verified negative proof or a contact sheet before results are published. |
| BR-08 | Contest milestones must follow the required chronological order; submissions are locked after the submission deadline. |
| BR-12 | Judging must protect participant identity through double-blind evaluation. |
| BR-13 | Judges must not see other judges' scores or comments before the judging round closes. |
| BR-15 | Scoring criterion weights for each category must total exactly 100%. |
| BR-16 | Published contest results cannot be changed. |
| BR-20 | At least three active judges are required for each category before judging. |
| BR-24 | Submission edits and withdrawals are restricted by the deadline and judging start. |
| BR-25 | The final score is the average of assigned judges' total scores, rounded to two decimal places. |
