import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
      backgroundColor: scheme.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.asset(
                'assets/images/logo.png',
                width: 120,
                height: 120,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    Icon(Icons.movie_filter_outlined, size: 96, color: scheme.onPrimary),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'CINEGEN',
              style: theme.textTheme.headlineLarge?.copyWith(
                color: scheme.onPrimary,
                fontWeight: FontWeight.bold,
                letterSpacing: 2.0,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Nền tảng nhiếp ảnh phim analog',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: scheme.onPrimary.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}