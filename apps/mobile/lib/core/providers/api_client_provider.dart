import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../network/api_client.dart';
import 'auth_provider.dart';
import 'token_storage_provider.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    baseUrl: AppConfig.apiBaseUrl,
    tokenStorage: ref.watch(authTokenStorageProvider),
    onUnauthenticated: () => ref.read(authProvider.notifier).logout(),
  );
});