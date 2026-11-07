import 'package:flutter/material.dart';
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
import '../screens/submission/submission_upload_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/splash',
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
      path: '/contests/:id',
      builder: (context, state) {
        final contestId = state.pathParameters['id']!;
        return ContestDetailScreen(contestId: contestId);
      },
    ),
    GoRoute(
      path: '/contests/:id/submit',
      builder: (context, state) {
        final contestId = state.pathParameters['id'];
        final extra = state.extra;
        final map = extra is Map ? extra : null;
        final contestTitle = state.uri.queryParameters['contestTitle'] ??
            (map?['contestTitle'] is String ? map!['contestTitle'] as String : null);
        final categoryId = state.uri.queryParameters['categoryId'] ??
            (map?['categoryId'] is String ? map!['categoryId'] as String : null);
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
      path: '/profile',
      builder: (context, state) => Scaffold(
        appBar: AppBar(title: const Text('Cá nhân')),
        body: const ProfileScreen(),
      ),
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
      path: '/submissions/upload',
      builder: (context, state) {
        final extra = state.extra;
        final map = extra is Map ? extra : null;
        final contestId = state.uri.queryParameters['contestId'] ??
            (map?['contestId'] is String ? map!['contestId'] as String : null);
        final contestTitle = state.uri.queryParameters['contestTitle'] ??
            (map?['contestTitle'] is String ? map!['contestTitle'] as String : null);
        final categoryId = state.uri.queryParameters['categoryId'] ??
            (map?['categoryId'] is String ? map!['categoryId'] as String : null);
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
  ],
);
