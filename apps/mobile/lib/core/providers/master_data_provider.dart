import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/master_data.dart';
import '../data/master_data_repository.dart';
import 'api_client_provider.dart';

final masterDataRepositoryProvider = Provider<MasterDataRepository>((ref) {
  return ApiMasterDataRepository(ref.watch(apiClientProvider).dio);
});

final masterDataCatalogProvider = FutureProvider<MasterDataCatalog>((ref) async {
  return ref.watch(masterDataRepositoryProvider).fetchCatalog();
});
