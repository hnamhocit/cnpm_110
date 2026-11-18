import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/user_portfolio.dart';
import '../data/portfolio_repository.dart';
import 'api_client_provider.dart';
import 'auth_provider.dart';

final portfolioRepositoryProvider = Provider<PortfolioRepository>((ref) {
  return ApiPortfolioRepository(ref.watch(apiClientProvider).dio);
});

/// Provider cung cấp Portfolio cá nhân & lịch sử giải thưởng (FPC-101)
final userPortfolioProvider = FutureProvider<UserPortfolio>((ref) async {
  final authState = ref.watch(authProvider);
  if (!authState.isLoggedIn) {
    throw Exception('Vui lòng đăng nhập để xem Portfolio');
  }

  final repository = ref.watch(portfolioRepositoryProvider);
  try {
    return await repository.fetchMyPortfolio();
  } catch (_) {
    // Graceful fallback từ thông tin AuthState
    return UserPortfolio.fromAuthAndSubmissions(
      id: authState.userId ?? '',
      fullName: authState.fullName ?? 'Nhiếp ảnh gia',
      email: authState.email ?? '',
      role: authState.role ?? 'Participant',
    );
  }
}, retry: (retryCount, error) => null);
