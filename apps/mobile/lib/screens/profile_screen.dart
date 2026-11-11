import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/providers/auth_provider.dart';
import 'profile/change_password_screen.dart';
import 'profile/edit_profile_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  static const _menuItems = [
    (icon: Icons.edit_outlined, title: 'Cập nhật thông tin'),
    (icon: Icons.lock_outline, title: 'Đổi mật khẩu'),
    (icon: Icons.settings_outlined, title: 'Cài đặt ứng dụng'),
    (icon: Icons.help_outline, title: 'Trợ giúp'),
  ];

  void _handleMenuAction(BuildContext context, int index) {
    switch (index) {
      case 0:
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const EditProfileScreen(),
          ),
        );
        break;
      case 1:
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const ChangePasswordScreen(),
          ),
        );
        break;
      case 2:
        _showAppSettingsDialog(context);
        break;
      case 3:
        _showHelpDialog(context);
        break;
    }
  }

  void _showAppSettingsDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.settings_outlined),
            SizedBox(width: 8),
            Text('Cài đặt ứng dụng'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Phiên bản: 1.0.0 (Build 2026)'),
            SizedBox(height: 8),
            Text('Chế độ giao diện: Theo hệ thống'),
            SizedBox(height: 8),
            Text('Ngôn ngữ: Tiếng Việt'),
            SizedBox(height: 12),
            Text(
              'Các tùy chọn cấu hình nâng cao khác đang trong lộ trình phát triển.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showHelpDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.help_outline),
            SizedBox(width: 8),
            Text('Trợ giúp & Hỗ trợ'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Film Photography Contest Platform'),
            SizedBox(height: 8),
            Text('Email hỗ trợ: support@filmcontest.vn'),
            SizedBox(height: 8),
            Text('Hotline: 1900 110 000 (8:00 - 18:00)'),
            SizedBox(height: 12),
            Text(
              'Trung tâm tài liệu trợ giúp trực tuyến đang trong lộ trình phát triển.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(dialogContext).colorScheme.error,
              foregroundColor: Theme.of(dialogContext).colorScheme.onError,
            ),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );

    if (shouldLogout == true) {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final authState = ref.watch(authProvider);

    final displayName = authState.fullName?.trim().isNotEmpty == true
        ? authState.fullName!.trim()
        : (authState.email?.split('@').first ?? 'Người dùng');
    final email = authState.email ?? 'Chưa cập nhật email';
    final avatarLetter = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      children: [
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 48,
                backgroundColor: colorScheme.primaryContainer,
                foregroundColor: colorScheme.onPrimaryContainer,
                child: Text(
                  avatarLetter,
                  style: const TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                displayName,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                email,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
              ),
              if (authState.role != null) ...[
                const SizedBox(height: 8),
                Chip(
                  label: Text(authState.role!),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        Card(
          elevation: 0,
          color: colorScheme.primaryContainer.withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: colorScheme.primary.withValues(alpha: 0.3)),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              child: const Icon(Icons.collections_bookmark_outlined),
            ),
            title: const Text(
              'Bài thi của tôi',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: const Text('Theo dõi trạng thái duyệt & âm bản'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/my-submissions'),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              for (var index = 0; index < _menuItems.length; index++) ...[
                ListTile(
                  leading: Icon(_menuItems[index].icon),
                  title: Text(_menuItems[index].title),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _handleMenuAction(context, index),
                ),
                if (index < _menuItems.length - 1)
                  const Divider(height: 1, indent: 56),
              ],
            ],
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout),
            label: const Text('Đăng xuất'),
            style: OutlinedButton.styleFrom(
              foregroundColor: colorScheme.error,
              side: BorderSide(color: colorScheme.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      ],
    );
  }
}
