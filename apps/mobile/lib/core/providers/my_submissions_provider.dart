import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/user_submission.dart';
import '../data/submission_repository.dart';

enum SubmissionFilter {
  all('Tất cả'),
  proofRequested('Cần âm bản'),
  pending('Đang chờ'),
  approved('Đã duyệt'),
  disqualified('Bị loại');

  const SubmissionFilter(this.label);
  final String label;
}

class MySubmissionsFilterNotifier extends Notifier<SubmissionFilter> {
  @override
  SubmissionFilter build() => SubmissionFilter.all;

  void select(SubmissionFilter filter) => state = filter;
}

final mySubmissionsFilterProvider =
    NotifierProvider<MySubmissionsFilterNotifier, SubmissionFilter>(
  MySubmissionsFilterNotifier.new,
);

class MySubmissionsSearchNotifier extends Notifier<String> {
  @override
  String build() => '';

  void setQuery(String query) => state = query;
}

final mySubmissionsSearchProvider =
    NotifierProvider<MySubmissionsSearchNotifier, String>(
  MySubmissionsSearchNotifier.new,
);

class MySubmissionsNotifier extends AsyncNotifier<List<UserSubmission>> {
  @override
  Future<List<UserSubmission>> build() async {
    return _fetchSubmissions();
  }

  Future<List<UserSubmission>> _fetchSubmissions() async {
    final repository = ref.read(submissionRepositoryProvider);
    return repository.getMySubmissions();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchSubmissions());
  }
}

final mySubmissionsProvider =
    AsyncNotifierProvider<MySubmissionsNotifier, List<UserSubmission>>(
  MySubmissionsNotifier.new,
);

final filteredSubmissionsProvider = Provider<List<UserSubmission>>((ref) {
  final submissionsAsync = ref.watch(mySubmissionsProvider);
  final submissions = submissionsAsync.value ?? const [];
  final filter = ref.watch(mySubmissionsFilterProvider);
  final search = ref.watch(mySubmissionsSearchProvider).trim().toLowerCase();

  return submissions.where((sub) {
    // 1. Filter by status
    final bool matchesFilter;
    switch (filter) {
      case SubmissionFilter.all:
        matchesFilter = true;
        break;
      case SubmissionFilter.proofRequested:
        matchesFilter = sub.status == SubmissionStatus.proofRequested;
        break;
      case SubmissionFilter.pending:
        matchesFilter = sub.status == SubmissionStatus.pendingAi ||
            sub.status == SubmissionStatus.aiFlagged ||
            sub.status == SubmissionStatus.proofSubmitted;
        break;
      case SubmissionFilter.approved:
        matchesFilter = sub.status == SubmissionStatus.approved;
        break;
      case SubmissionFilter.disqualified:
        matchesFilter = sub.status == SubmissionStatus.disqualified ||
            sub.status == SubmissionStatus.disqualifiedNoProof;
        break;
    }

    if (!matchesFilter) return false;

    // 2. Filter by search query
    if (search.isEmpty) return true;

    final titleMatch = sub.title.toLowerCase().contains(search);
    final codeMatch = sub.displayCode.toLowerCase().contains(search);
    final contestMatch = sub.contestTitle?.toLowerCase().contains(search) ?? false;
    final metadataMatch = sub.filmMetadata?.summary.toLowerCase().contains(search) ?? false;

    return titleMatch || codeMatch || contestMatch || metadataMatch;
  }).toList();
});

final proofRequestedCountProvider = Provider<int>((ref) {
  final submissions = ref.watch(mySubmissionsProvider).value ?? const [];
  return submissions.where((s) => s.status == SubmissionStatus.proofRequested).length;
});
