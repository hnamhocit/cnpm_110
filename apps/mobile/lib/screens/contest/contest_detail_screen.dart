import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/auth_provider.dart';
import '../../core/providers/contest_detail_provider.dart';
import '../../core/utils/date_format.dart';
import '../../models/contest.dart';

class RegisteredContestsNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => <String>{};

  void register(String contestId) {
    state = {...state, contestId};
  }
}

final registeredContestsProvider =
    NotifierProvider<RegisteredContestsNotifier, Set<String>>(
  RegisteredContestsNotifier.new,
);

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
        error: (error, stackTrace) => ErrorView(
          message: error.toString(),
          onRetry: () => ref.invalidate(contestDetailProvider(contestId)),
        ),
        data: (contest) => ContestDetailBody(contest: contest),
      ),
    );
  }
}

class ContestDetailBody extends ConsumerWidget {
  const ContestDetailBody({super.key, required this.contest});

  final Contest contest;

  void _handleRegister(BuildContext context, WidgetRef ref) {
    final authState = ref.read(authProvider);

    if (!authState.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập để đăng ký tham gia cuộc thi'),
        ),
      );
      context.push('/login');
      return;
    }

    if (authState.role != null && authState.role != 'Participant') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Tài khoản vai trò ${authState.role} không thể đăng ký. Chỉ thí sinh mới được tham gia.',
          ),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      return;
    }

    ref.read(registeredContestsProvider.notifier).register(contest.id);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đăng ký tham gia cuộc thi thành công!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final registeredSet = ref.watch(registeredContestsProvider);
    final isRegistered = registeredSet.contains(contest.id);

    final canRegister = (contest.status == ContestStatus.published ||
            contest.status == ContestStatus.ongoing) &&
        !isRegistered;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StatusChip(status: contest.status),
                const SizedBox(height: 12),
                Text(
                  contest.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),
                DateRow(
                  label: 'Bắt đầu',
                  value: contest.startAt,
                ),
                const SizedBox(height: 8),
                DateRow(
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
                    ? () => _handleRegister(context, ref)
                    : null,
                child: Text(
                  isRegistered
                      ? 'Đã đăng ký tham gia'
                      : 'Đăng ký tham gia',
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final ContestStatus status;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(status.label),
      visualDensity: VisualDensity.compact,
    );
  }
}

class DateRow extends StatelessWidget {
  const DateRow({super.key, required this.label, required this.value});

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

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, required this.onRetry});

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