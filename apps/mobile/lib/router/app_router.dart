import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/main_screen.dart';
import '../screens/profile_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
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
  ],
);
