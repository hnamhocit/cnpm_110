import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/film_dev_scan/film_dev_scan_screen.dart';
import '../screens/film_params/film_params_screen.dart';
import '../screens/main_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/submission/submission_upload_screen.dart';

/// BR-04: Kiểm tra token JWT hợp lệ cho các màn hình yêu cầu xác thực
Future<String?> _checkAuthRedirect() async {
  try {
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'access_token');
    final isLoggedIn = token != null && token.isNotEmpty;

    if (!isLoggedIn) {
      return '/login';
    }
  } catch (_) {
    return '/login';
  }
  return null;
}

final GoRouter appRouter = GoRouter(
  initialLocation: '/splash',
  // BR-04: Đảm bảo cơ chế bảo mật JWT/Token hợp lệ cho các màn hình yêu cầu xác thực
  redirect: (context, state) {
    final location = state.matchedLocation;
    final isPublicRoute = location == '/splash' ||
        location == '/login' ||
        location == '/register';

    // Trả về null đồng bộ cho các route public để không hoãn mount widget ban đầu
    if (isPublicRoute) {
      return null;
    }

    return _checkAuthRedirect();
  },
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const MainScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => Scaffold(
        appBar: AppBar(title: const Text('Cá nhân')),
        body: const ProfileScreen(),
      ),
    ),
    GoRoute(
      path: '/film-params',
      builder: (context, state) => const FilmParamsScreen(),
    ),
    // Bug 16: Khai báo route màn hình thông số tráng scan
    GoRoute(
      path: '/film-dev-scan',
      builder: (context, state) => const FilmDevScanScreen(),
    ),
    // Bug 16 & Bug 14: Route nộp bài thi (nhận tham số qua Query Parameters hoặc state.extra)
    GoRoute(
      path: '/submission',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        final contestId = state.uri.queryParameters['contestId'] ??
            (extra?['contestId'] as String?) ??
            '';
        final categoryId = state.uri.queryParameters['categoryId'] ??
            (extra?['categoryId'] as String?) ??
            '';
        final contestTitle = state.uri.queryParameters['contestTitle'] ??
            (extra?['contestTitle'] as String?);

        return SubmissionUploadScreen(
          contestId: contestId,
          categoryId: categoryId,
          contestTitle: contestTitle,
        );
      },
    ),
    // Bug 16 & Bug 14: Route nộp bài thi (nhận tham số qua Path Parameters)
    GoRoute(
      path: '/submission/:contestId/:categoryId',
      builder: (context, state) {
        final contestId = state.pathParameters['contestId'] ?? '';
        final categoryId = state.pathParameters['categoryId'] ?? '';
        final extra = state.extra as Map<String, dynamic>?;
        final contestTitle = state.uri.queryParameters['contestTitle'] ??
            (extra?['contestTitle'] as String?);

        return SubmissionUploadScreen(
          contestId: contestId,
          categoryId: categoryId,
          contestTitle: contestTitle,
        );
      },
    ),
  ],
);
