import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

import '../models/film_dev_scan_params.dart';
import '../models/film_shooting_params.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/contest/contest_detail_screen.dart';
import '../screens/film_dev_scan/film_dev_scan_screen.dart';
import '../screens/film_params/film_params_screen.dart';
import '../screens/main_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/submission/my_submissions_screen.dart';
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
      path: '/my-submissions',
      builder: (context, state) => const MySubmissionsScreen(),
    ),
    GoRoute(
      path: '/contests/:id',
      builder: (context, state) {
        final contestId = state.pathParameters['id']!;
        return ContestDetailScreen(contestId: contestId);
      },
    ),
    GoRoute(
      path: '/contests/:id/submit',
      builder: (context, state) {
        final contestId = state.pathParameters['id'] ?? '';
        final extra = state.extra;
        final map = extra is Map ? extra : null;
        final contestTitle = state.uri.queryParameters['contestTitle'] ??
            (map?['contestTitle'] is String ? map!['contestTitle'] as String : null);
        final categoryId = state.uri.queryParameters['categoryId'] ??
            (map?['categoryId'] is String ? map!['categoryId'] as String : null) ??
            '';
        final shootingParams = map?['initialShootingParams'] is FilmShootingParams
            ? map!['initialShootingParams'] as FilmShootingParams
            : null;
        final devScanParams = map?['initialDevScanParams'] is FilmDevScanParams
            ? map!['initialDevScanParams'] as FilmDevScanParams
            : null;

        return SubmissionUploadScreen(
          contestId: contestId,
          contestTitle: contestTitle,
          categoryId: categoryId,
          initialShootingParams: shootingParams,
          initialDevScanParams: devScanParams,
        );
      },
    ),
    GoRoute(
      path: '/submissions/upload',
      builder: (context, state) {
        final extra = state.extra;
        final map = extra is Map ? extra : null;
        final contestId = state.uri.queryParameters['contestId'] ??
            (map?['contestId'] is String ? map!['contestId'] as String : null) ??
            '';
        final contestTitle = state.uri.queryParameters['contestTitle'] ??
            (map?['contestTitle'] is String ? map!['contestTitle'] as String : null);
        final categoryId = state.uri.queryParameters['categoryId'] ??
            (map?['categoryId'] is String ? map!['categoryId'] as String : null) ??
            '';
        final shootingParams = map?['initialShootingParams'] is FilmShootingParams
            ? map!['initialShootingParams'] as FilmShootingParams
            : null;
        final devScanParams = map?['initialDevScanParams'] is FilmDevScanParams
            ? map!['initialDevScanParams'] as FilmDevScanParams
            : null;

        return SubmissionUploadScreen(
          contestId: contestId,
          contestTitle: contestTitle,
          categoryId: categoryId,
          initialShootingParams: shootingParams,
          initialDevScanParams: devScanParams,
        );
      },
    ),
    GoRoute(
      path: '/film-params',
      builder: (context, state) {
        final extra = state.extra;
        final map = extra is Map ? extra : null;
        final initialParams = extra is FilmShootingParams
            ? extra
            : (map?['initialParams'] is FilmShootingParams
                ? map!['initialParams'] as FilmShootingParams
                : null);
        final rawOnSaved = map?['onSaved'];
        final onSaved = rawOnSaved is ValueChanged<FilmShootingParams>
            ? rawOnSaved
            : (rawOnSaved is void Function(FilmShootingParams)
                ? rawOnSaved
                : null);

        return FilmParamsScreen(
          initialParams: initialParams,
          onSaved: onSaved,
        );
      },
    ),
    GoRoute(
      path: '/film-dev-scan',
      builder: (context, state) {
        final extra = state.extra;
        final map = extra is Map ? extra : null;
        final initialParams = extra is FilmDevScanParams
            ? extra
            : (map?['initialParams'] is FilmDevScanParams
                ? map!['initialParams'] as FilmDevScanParams
                : null);
        final rawOnSaved = map?['onSaved'];
        final onSaved = rawOnSaved is ValueChanged<FilmDevScanParams>
            ? rawOnSaved
            : (rawOnSaved is void Function(FilmDevScanParams)
                ? rawOnSaved
                : null);

        return FilmDevScanScreen(
          initialParams: initialParams,
          onSaved: onSaved,
        );
      },
    ),
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
