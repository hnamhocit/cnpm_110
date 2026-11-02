
import 'package:flutter/material.dart';

import '../../core/utils/date_format.dart';
import '../../models/contest.dart';

class ContestCard extends StatelessWidget {
  const ContestCard({
    super.key,
    required this.contest,
    this.onTap,
  });

  final Contest contest;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final description = contest.description?.trim();

    final startDateStr = contest.startAt != null
        ? formatDate(contest.startAt!)
        : 'Chưa cập nhật';

    final endDateStr = contest.endAt != null
        ? formatDate(contest.endAt!)
        : 'Chưa cập nhật';

    final String dateRange;

    if (contest.startAt == null && contest.endAt == null) {
      dateRange = 'Chưa cập nhật';
    } else if (contest.startAt == null) {
      dateRange = 'Đến $endDateStr';
    } else if (contest.endAt == null) {
      dateRange = 'Từ $startDateStr';
    } else {
      dateRange = '$startDateStr - $endDateStr';
    }

    final background = switch (contest.status) {
      ContestStatus.open => Colors.green.shade100,
      ContestStatus.ongoing => Colors.blue.shade100,
      ContestStatus.underReview => Colors.orange.shade100,
      ContestStatus.judging => Colors.purple.shade100,
      ContestStatus.published => Colors.teal.shade100,
      ContestStatus.completed => Colors.teal.shade100,
      ContestStatus.archived => Colors.grey.shade200,
      ContestStatus.cancelled => Colors.red.shade100,
      ContestStatus.draft => Colors.grey.shade200,
    };

    final foreground = switch (contest.status) {
      ContestStatus.open => Colors.green.shade900,
      ContestStatus.ongoing => Colors.blue.shade900,
      ContestStatus.underReview => Colors.orange.shade900,
      ContestStatus.judging => Colors.purple.shade900,
      ContestStatus.published => Colors.teal.shade900,
      ContestStatus.completed => Colors.teal.shade900,
      ContestStatus.archived => Colors.grey.shade800,
      ContestStatus.cancelled => Colors.red.shade900,
      ContestStatus.draft => Colors.grey.shade800,
    };

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      contest.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      contest.status.label,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: foreground,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              if (description != null && description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],

              const SizedBox(height: 12),

              Row(
                children: [
                  Icon(
                    Icons.calendar_today_outlined,
                    size: 16,
                    color: scheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    dateRange,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
