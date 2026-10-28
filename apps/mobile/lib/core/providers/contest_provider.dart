import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/contest.dart';
import '../data/contest_repository.dart';
import '../network/api_exception.dart';
import 'api_client_provider.dart';

enum ContestFilter {
  all('Tất cả', null),
  upcoming('Sắp diễn ra', ContestStatus.published),
  ongoing('Đang diễn ra', ContestStatus.ongoing);

  const ContestFilter(this.label, this.status);

  final String label;
  final ContestStatus? status;
}

class ContestListState {
  const ContestListState({
    required this.items,
    required this.page,
    required this.hasMore,
    this.isLoadingMore = false,
    this.loadMoreError,
  });

  final List<Contest> items;
  final int page;
  final bool hasMore;
  final bool isLoadingMore;
  final String? loadMoreError;

  ContestListState copyWith({
    List<Contest>? items,
    int? page,
    bool? hasMore,
    bool? isLoadingMore,
    String? loadMoreError,
    bool clearLoadMoreError = false,
  }) {
    return ContestListState(
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      loadMoreError: clearLoadMoreError
          ? null
          : (loadMoreError ?? this.loadMoreError),
    );
  }
}

final contestRepositoryProvider = Provider<ContestRepository>((ref) {
  return ApiContestRepository(ref.watch(apiClientProvider).dio);
});

class ContestFilterNotifier extends Notifier<ContestFilter> {
  @override
  ContestFilter build() => ContestFilter.all;

  void select(ContestFilter filter) => state = filter;
}

final contestFilterProvider =
    NotifierProvider<ContestFilterNotifier, ContestFilter>(
      ContestFilterNotifier.new,
    );

class ContestListNotifier extends AsyncNotifier<ContestListState> {
  static const _pageSize = 10;

  @override
  Future<ContestListState> build() async {
    final filter = ref.watch(contestFilterProvider);
    final repository = ref.watch(contestRepositoryProvider);

    final page = await repository.fetchContests(
      status: filter.status,
      page: 1,
      limit: _pageSize,
    );

    return ContestListState(
      items: page.items,
      page: page.page,
      hasMore: page.hasMore,
    );
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.hasMore || current.isLoadingMore) return;

    final filter = ref.read(contestFilterProvider);
    state = AsyncData(
      current.copyWith(isLoadingMore: true, clearLoadMoreError: true),
    );

    try {
      final page = await ref
          .read(contestRepositoryProvider)
          .fetchContests(
            status: filter.status,
            page: current.page + 1,
            limit: _pageSize,
          );

      if (ref.read(contestFilterProvider) != filter) return;

      state = AsyncData(
        current.copyWith(
          items: [...current.items, ...page.items],
          page: page.page,
          hasMore: page.hasMore,
          isLoadingMore: false,
        ),
      );
    } on ApiException catch (error) {
      if (ref.read(contestFilterProvider) != filter) return;
      state = AsyncData(
        current.copyWith(isLoadingMore: false, loadMoreError: error.message),
      );
    }
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    try {
      await future;
    } catch (_) {
      return;
    }
  }
}

final contestListProvider =
    AsyncNotifierProvider<ContestListNotifier, ContestListState>(
      ContestListNotifier.new,
      retry: (retryCount, error) => null,
    );