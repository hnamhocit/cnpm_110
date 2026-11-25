import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/cinegen_theme.dart';
import '../../core/providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _goNext();
  }

  Future<void> _goNext() async {
    await Future.wait([
      Future<void>.delayed(const Duration(seconds: 2)),
      ref.read(authProvider.notifier).restoreSession(),
    ]);
    if (!mounted) return;
    final isLoggedIn = ref.read(authProvider).isLoggedIn;
    context.go(isLoggedIn ? '/' : '/login');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: cinegenInk,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CinegenMark(size: 148),
            const SizedBox(height: 16),
            Text(
              cinegenName,
              style: theme.textTheme.headlineMedium?.copyWith(
                color: scheme.onPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cuộc thi nhiếp ảnh phim',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: scheme.onPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}