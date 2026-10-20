import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/film_params/film_params_screen.dart';
import '../screens/main_screen.dart';
import '../screens/profile_screen.dart';

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
  ],
);