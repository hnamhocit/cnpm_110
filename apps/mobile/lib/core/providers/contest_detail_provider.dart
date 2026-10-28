import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/contest.dart';
import 'contest_provider.dart';

final contestDetailProvider =
    FutureProvider.family<Contest, String>((ref, id) async {
  final repository = ref.watch(contestRepositoryProvider);
  return repository.fetchContest(id);
}, retry: (retryCount, error) => null);