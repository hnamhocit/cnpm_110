import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/contest_detail_provider.dart';
import '../../core/utils/date_format.dart';
import '../../models/contest.dart';

class ContestDetailScreen extends ConsumerWidget {
  const ContestDetailScreen({super.key, required this.contestId});

  final String contestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncContest = ref.watch(contestDetailProvider(contestId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết cuộc thi'),
      ),
      body: asyncContest.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _ErrorView(
          message: error.toString(),
          onRetry: () => ref.invalidate(contestDetailProvider(contestId)),
        ),
        data: (contest) => _ContestDetailBody(contest: contest),
      ),
    );
  }
}

class _ContestDetailBody extends StatelessWidget {
  const _ContestDetailBody({required this.contest});

  final Contest contest;

  @override
  Widget build(BuildContext context) {
    final canRegister = contest.status == ContestStatus.published ||
        contest.status == ContestStatus.ongoing;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusChip(status: contest.status),
                const SizedBox(height: 12),
                Text(
                  contest.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),
                _DateRow(
                  label: 'Bắt đầu',
                  value: contest.startAt,
                ),
                const SizedBox(height: 8),
                _DateRow(
                  label: 'Kết thúc',
                  value: contest.endAt,
                ),
                if (contest.description != null &&
                    contest.description!.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text(
                    'Mô tả',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    contest.description!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ],
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: canRegister
                    ? () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Chức năng đăng ký sẽ được hoàn thiện ở FPC-42',
                            ),
                          ),
                        );
                      }
                    : null,
                child: const Text('Đăng ký tham gia'),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final ContestStatus status;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(status.label),
      visualDensity: VisualDensity.compact,
    );
  }
}

class _DateRow extends StatelessWidget {
  const _DateRow({required this.label, required this.value});

  final String label;
  final DateTime? value;

  @override
  Widget build(BuildContext context) {
    final text = value != null ? formatDate(value!) : 'Chưa cập nhật';
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }
}