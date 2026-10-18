import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/auth_token_storage.dart';

final authTokenStorageProvider = Provider<AuthTokenStorage>(
  (ref) => SecureAuthTokenStorage(),
);