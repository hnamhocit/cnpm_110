import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/film_logbook.dart';
import '../data/film_logbook_repository.dart';
import 'api_client_provider.dart';

final filmLogbookRepositoryProvider = Provider<FilmLogbookRepository>((ref) {
  return ApiFilmLogbookRepository(ref.watch(apiClientProvider).dio);
});

final myFilmRollsProvider = FutureProvider<List<FilmRoll>>((ref) async {
  return ref.watch(filmLogbookRepositoryProvider).fetchMyRolls();
});

final filmRollDetailProvider =
    FutureProvider.family<FilmRoll, String>((ref, rollId) async {
  return ref.watch(filmLogbookRepositoryProvider).fetchRollDetail(rollId);
});
