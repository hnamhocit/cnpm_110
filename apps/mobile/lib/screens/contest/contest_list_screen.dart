import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers/contest_provider.dart';
import 'contest_card.dart';

class ContestListScreen extends ConsumerStatefulWidget {
  const ContestListScreen({super.key});

  @override
  ConsumerState<ContestListScreen> createState() => _ContestListScreenState();
}

class _ContestListScreenState extends ConsumerState<ContestListScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 200) {
      ref.read(contestListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final selected = ref.watch(contestFilterProvider);
    final contests = ref.watch(contestListProvider);

    return Column(
      children: [
        SizedBox(
          height: 56,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: ContestFilter.values.length,
            separatorBuilder: (context, index) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final filter = ContestFilter.values[index];
              return ChoiceChip(
                label: Text(filter.label),
                selected: filter == selected,
                onSelected: (_) =>
                    ref.read(contestFilterProvider.notifier).select(filter),
              );
            },
          ),
        ),
        Expanded(
          child: contests.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => _MessageView(
              icon: Icons.cloud_off_outlined,
              message: error is ApiException
                  ? error.message
                  : 'Không tải được danh sách cuộc thi',
              actionLabel: 'Thử lại',
              onAction: () => ref.invalidate(contestListProvider),
            ),
            data: (state) {
              if (state.items.isEmpty) {
                return const _MessageView(
                  icon: Icons.photo_library_outlined,
                  message: 'Chưa có cuộc thi nào trong mục này',
                );
              }

              final showFooter =
                  state.isLoadingMore || state.loadMoreError != null;

              return RefreshIndicator(
                onRefresh: () =>
                    ref.read(contestListProvider.notifier).refresh(),
                child: ListView.separated(
                  controller: _scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  itemCount: state.items.length + (showFooter ? 1 : 0),
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    if (index >= state.items.length) {
                      return _LoadMoreFooter(
                        isLoading: state.isLoadingMore,
                        error: state.loadMoreError,
                        onRetry: () =>
                            ref.read(contestListProvider.notifier).loadMore(),
                      );
                    }
                    final contest = state.items[index];
                    return ContestCard(
                      contest: contest,
                      onTap: () => context.push('/contests/${contest.id}'),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _LoadMoreFooter extends StatelessWidget {
  const _LoadMoreFooter({
    required this.isLoading,
    required this.error,
    required this.onRetry,
  });

  final bool isLoading;
  final String? error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Column(
      children: [
        Text(error ?? '', textAlign: TextAlign.center),
        TextButton(onPressed: onRetry, child: const Text('Thử lại')),
      ],
    );
  }
}

class _MessageView extends StatelessWidget {
  const _MessageView({
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: scheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 12),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}