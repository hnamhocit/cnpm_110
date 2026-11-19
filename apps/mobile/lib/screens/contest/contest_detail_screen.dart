import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/auth_provider.dart';
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

class _ContestDetailBody extends ConsumerWidget {
  const _ContestDetailBody({required this.contest});

  final Contest contest;

  void _handleRegister(BuildContext context, WidgetRef ref) {
    final authState = ref.read(authProvider);

    // 1. Chưa đăng nhập: yêu cầu đăng nhập và điều hướng sang /login
    if (!authState.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập để đăng ký tham gia cuộc thi'),
        ),
      );
      context.push('/login');
      return;
    }

    // 2. Kiểm tra vai trò: Chỉ cho phép Thí sinh (Participant) đăng ký
    final rawRole = authState.role?.trim();
    final role = rawRole?.toLowerCase();

    // Chặn vai trò Judge hoặc Organizer theo BR-21 (Conflict of Interest)
    if (role == 'judge' || role == 'organizer') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Tài khoản vai trò ${authState.role} không được phép đăng ký tham gia cuộc thi (Quy định BR-21).',
          ),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      return;
    }

    // Chặn role null hoặc rỗng
    if (role == null || role.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Không xác định được vai trò tài khoản. Vui lòng đăng nhập lại.',
          ),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      return;
    }

    // Chặn các vai trò không phải Thí sinh (Participant)
    if (role != 'participant') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Chỉ tài khoản Thí sinh (Participant) mới được phép đăng ký tham gia cuộc thi.',
          ),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      return;
    }

    // 3. Kiểm tra thời gian & trạng thái cuộc thi theo BR-08
    final now = DateTime.now();
    final isDraft = contest.status == ContestStatus.draft;
    final notStarted =
        contest.startAt != null && now.isBefore(contest.startAt!);
    if (isDraft || notStarted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cuộc thi chưa mở cổng đăng ký.'),
        ),
      );
      return;
    }

    final isDeadlinePassed =
        contest.endAt != null && !now.isBefore(contest.endAt!);
    final isClosedStatus = contest.status == ContestStatus.completed ||
        contest.status == ContestStatus.archived ||
        contest.status == ContestStatus.cancelled ||
        contest.status == ContestStatus.judging ||
        contest.status == ContestStatus.underReview ||
        contest.status == ContestStatus.published;

    if (isDeadlinePassed || isClosedStatus) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content:
              Text('Cổng đăng ký cho cuộc thi này đã chính thức đóng (BR-08).'),
        ),
      );
      return;
    }

    // 4. Nếu hợp lệ: chuyển tiếp trực tiếp vào flow nộp bài dự thi
    context.push(
      '/contests/${contest.id}/submit',
      extra: <String, dynamic>{
        'contestTitle': contest.name,
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDeadlinePassed =
        contest.endAt != null && !DateTime.now().isBefore(contest.endAt!);
    final canSubmit = (contest.status == ContestStatus.open ||
            contest.status == ContestStatus.ongoing) &&
        !isDeadlinePassed;

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
                if (contest.status == ContestStatus.published ||
                    contest.status == ContestStatus.completed ||
                    contest.status == ContestStatus.archived) ...[
                  const SizedBox(height: 20),
                  InkWell(
                    onTap: () {
                      context.push(
                        '/contests/${contest.id}/winners',
                        extra: {'contestTitle': contest.name},
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.amber.shade700,
                            Colors.orange.shade800,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.amber.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: const BoxDecoration(
                              color: Colors.white24,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.emoji_events,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'BẢNG VÀNG VINH DANH',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Khám phá các kiệt tác đạt giải & lời bình giám khảo',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios,
                            color: Colors.white,
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
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
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (contest.status == ContestStatus.published ||
                    contest.status == ContestStatus.completed ||
                    contest.status == ContestStatus.archived) ...[
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.amber.shade700,
                        foregroundColor: Colors.black,
                      ),
                      onPressed: () {
                        context.push(
                          '/contests/${contest.id}/winners',
                          extra: {'contestTitle': contest.name},
                        );
                      },
                      icon: const Icon(Icons.emoji_events),
                      label: const Text(
                        'Xem Bảng Vàng Vinh Danh',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                if (contest.status == ContestStatus.open ||
                    contest.status == ContestStatus.ongoing) ...[
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.tonalIcon(
                      onPressed: canSubmit
                          ? () {
                              context.push(
                                '/contests/${contest.id}/submit',
                                extra: <String, dynamic>{
                                  'contestTitle': contest.name,
                                },
                              );
                            }
                          : null,
                      icon: const Icon(Icons.cloud_upload_outlined),
                      label: const Text('Nộp bài dự thi'),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => _handleRegister(context, ref),
                    child: const Text('Đăng ký tham gia'),
                  ),
                ),
              ],
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
