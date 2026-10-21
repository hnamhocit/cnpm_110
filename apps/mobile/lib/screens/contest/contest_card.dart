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

  String get _dateRange {
    final start = contest.startAt;
    final end = contest.endAt;
    if (start == null && end == null) return 'Chưa công bố thời gian';
    if (start != null && end != null) {
      return '${formatDate(start)} - ${formatDate(end)}';
    }
    if (start != null) return 'Từ ${formatDate(start)}';
    return 'Đến ${formatDate(end!)}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final description = contest.description;

    final (background, foreground) = switch (contest.status) {
      ContestStatus.ongoing => (
        scheme.primaryContainer,
        scheme.onPrimaryContainer,
      ),
      ContestStatus.published => (
        scheme.tertiaryContainer,
        scheme.onTertiaryContainer,
      ),
      _ => (scheme.surfaceContainerHighest, scheme.onSurfaceVariant),
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
                  Text(_dateRange, style: theme.textTheme.bodySmall),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}