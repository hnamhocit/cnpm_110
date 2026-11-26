import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/components/cached_image_widget.dart';
import '../core/providers/auth_provider.dart';
import '../core/providers/portfolio_provider.dart';
import '../models/user_portfolio.dart';
import 'profile/change_password_screen.dart';
import 'profile/edit_profile_screen.dart';

/// Màn hình Profile nâng cấp thành Portfolio cá nhân (FPC-101 / SCR-PAR-08)
/// - Quản lý thông tin cá nhân & định danh nghệ sĩ nhiếp ảnh
/// - Lưu trữ lịch sử tất cả các giải thưởng đã đạt qua các cuộc thi (Awards & Trophy Case)
/// - Trưng bày bộ sưu tập tác phẩm phim analog đã được kiểm duyệt & triển lãm
/// - Quản trị tài khoản, bảo mật và cài đặt hệ thống
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
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
            Text('CINEGEN'),
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

  void _showAwardDetail(BuildContext context, UserAward award) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog.fullscreen(
        backgroundColor: Colors.black.withValues(alpha: 0.95),
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                minScale: 0.8,
                maxScale: 4.0,
                child: CachedImageWidget(
                  imageUrl: award.photoUrl,
                  fit: BoxFit.contain,
                  memCacheWidth: 1800,
                  memCacheHeight: 1800,
                  placeholder: (ctx, url) => const Center(
                    child: Icon(Icons.photo_size_select_actual_outlined, size: 48, color: Colors.amber),
                  ),
                  errorWidget: (ctx, url, error) => const Center(
                    child: Icon(Icons.broken_image, size: 64, color: Colors.grey),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: SafeArea(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: award.tierColor),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(award.rankEmoji, style: const TextStyle(fontSize: 18)),
                          const SizedBox(width: 8),
                          Text(
                            award.awardTitle,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 28),
                      tooltip: 'Đóng',
                      onPressed: () => Navigator.of(dialogContext).pop(),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: SafeArea(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              award.submissionTitle,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.amber.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.amber),
                            ),
                            child: Text(
                              '⭐ ${award.formattedScore}',
                              style: const TextStyle(
                                color: Colors.amber,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Cuộc thi: ${award.contestName}',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      if (award.filmStock != null || award.camera != null) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            if (award.filmStock != null)
                              _buildMiniBadge(Icons.movie_filter_outlined, award.filmStock!),
                            if (award.camera != null)
                              _buildMiniBadge(Icons.camera_alt_outlined, award.camera!),
                            if (award.filmFormat != null)
                              _buildMiniBadge(Icons.aspect_ratio_outlined, 'Khổ ${award.filmFormat}'),
                            if (award.developmentLab != null)
                              _buildMiniBadge(Icons.science_outlined, award.developmentLab!),
                          ],
                        ),
                      ],
                      if (award.juryCritique != null && award.juryCritique!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(
                          'Nhận xét: "${award.juryCritique}"',
                          style: const TextStyle(
                            color: Colors.amberAccent,
                            fontStyle: FontStyle.italic,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.amber),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(color: Colors.white, fontSize: 11)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final authState = ref.watch(authProvider);
    final portfolioAsync = ref.watch(userPortfolioProvider);

    final portfolio = portfolioAsync.asData?.value;
    final avatarUrl = portfolio?.avatarUrl;
    final displayName = portfolio?.fullName ?? (authState.fullName?.trim().isNotEmpty == true
        ? authState.fullName!.trim()
        : (authState.email?.split('@').first ?? 'Người dùng'));
    final email = authState.email ?? 'Chưa cập nhật email';
    final avatarLetter = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(userPortfolioProvider);
        await ref.read(userPortfolioProvider.future);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // 1. Photographer Hero & Identity Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
                  colorScheme.primaryContainer.withValues(alpha: 0.25),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.amber.withValues(alpha: 0.3),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 38,
                      backgroundColor: colorScheme.primary,
                      foregroundColor: colorScheme.onPrimary,
                      foregroundImage: avatarUrl == null ? null : NetworkImage(avatarUrl),
                      onForegroundImageError: avatarUrl == null ? null : (_, _) {},
                      child: Text(
                        avatarLetter,
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(5),
                      decoration: const BoxDecoration(
                        color: Colors.amber,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.camera_alt,
                        size: 14,
                        color: Colors.black,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  displayName,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Nhiếp ảnh gia Analog • Film Heritage Creator',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.amber,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (authState.role != null) ...[
                  const SizedBox(height: 6),
                  Chip(
                    label: Text(
                      authState.role!,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                    backgroundColor: colorScheme.surface,
                    visualDensity: VisualDensity.compact,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                  ),
                ],

                const SizedBox(height: 12),
                // Portfolio Stats Row
                portfolioAsync.when(
                  loading: () => const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  error: (_, _) => _buildStatsRow(
                    context,
                    totalSubmissions: 0,
                    approvedWorks: 0,
                    awardsCount: 0,
                  ),
                  data: (portfolio) => _buildStatsRow(
                    context,
                    totalSubmissions: portfolio.stats.totalSubmissions,
                    approvedWorks: portfolio.stats.approvedWorks,
                    awardsCount: portfolio.stats.awardsCount,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // 2. Tác phẩm dự thi & Kho ảnh của tôi (Quick Access)
          Card(
            elevation: 0,
            color: colorScheme.primaryContainer.withValues(alpha: 0.35),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(color: colorScheme.primary.withValues(alpha: 0.3)),
            ),
            child: ListTile(
              dense: true,
              leading: CircleAvatar(
                radius: 18,
                backgroundColor: colorScheme.primary,
                foregroundColor: colorScheme.onPrimary,
                child: const Icon(Icons.collections_bookmark_outlined, size: 18),
              ),
              title: const Text(
                'Bài thi của tôi',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              subtitle: const Text(
                'Theo dõi tiến trình duyệt & nộp bằng chứng âm bản',
                style: TextStyle(fontSize: 12),
              ),
              trailing: const Icon(Icons.chevron_right, size: 20),
              onTap: () => context.push('/my-submissions'),
            ),
          ),

          const SizedBox(height: 12),

          // 3. Menu Cài Đặt & Quản Lý Tài Khoản
          Card(
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                for (var index = 0; index < _menuItems.length; index++) ...[
                  ListTile(
                    dense: true,
                    leading: Icon(_menuItems[index].icon, size: 20),
                    title: Text(_menuItems[index].title, style: const TextStyle(fontSize: 14)),
                    trailing: const Icon(Icons.chevron_right, size: 18),
                    onTap: () => _handleMenuAction(context, index),
                  ),
                  if (index < _menuItems.length - 1)
                    const Divider(height: 1, indent: 48),
                ],
              ],
            ),
          ),

          const SizedBox(height: 18),

          // 4. Tủ Giải Thưởng Đã Đạt (Awards & Trophy Case - FPC-101 Core Feature)
          Row(
            children: [
              const Text('🏆', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text(
                'Lịch Sử Giải Thưởng Đã Đạt',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          portfolioAsync.when(
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (err, _) => Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text('Chưa thể tải lịch sử giải thưởng.'),
            ),
            data: (portfolio) {
              if (portfolio.awards.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: colorScheme.outlineVariant),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.emoji_events_outlined, size: 40, color: Colors.grey),
                      const SizedBox(height: 8),
                      const Text(
                        'Chưa có giải thưởng chính thức',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Các giải thưởng từ cuộc thi đã công bố (PUBLISHED) sẽ tự động được lưu trữ và vinh danh vĩnh viễn tại Portfolio của bạn.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 11, color: colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                );
              }

              return Column(
                children: portfolio.awards
                    .map((award) => _buildAwardCard(context, award))
                    .toList(),
              );
            },
          ),

          const SizedBox(height: 20),

          // 5. Nút Đăng Xuất
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _confirmLogout(context, ref),
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('Đăng xuất'),
              style: OutlinedButton.styleFrom(
                foregroundColor: colorScheme.error,
                side: BorderSide(color: colorScheme.error),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(
    BuildContext context, {
    required int totalSubmissions,
    required int approvedWorks,
    required int awardsCount,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildStatItem('🏆 Giải thưởng', '$awardsCount', Colors.amber),
        Container(height: 28, width: 1, color: Colors.grey.withValues(alpha: 0.3)),
        _buildStatItem('📸 Tác phẩm', '$totalSubmissions', Colors.blue),
        Container(height: 28, width: 1, color: Colors.grey.withValues(alpha: 0.3)),
        _buildStatItem('✨ Hợp lệ', '$approvedWorks', Colors.green),
      ],
    );
  }

  Widget _buildStatItem(String label, String value, Color accentColor) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: accentColor,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildAwardCard(BuildContext context, UserAward award) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 2,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: award.isGold
              ? Colors.amber.withValues(alpha: 0.6)
              : colorScheme.outlineVariant,
          width: award.isGold ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        onTap: () => _showAwardDetail(context, award),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Photo Thumbnail with Rank Badge
              Stack(
                alignment: Alignment.topLeft,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 80,
                      height: 80,
                      child: CachedImageWidget(
                        imageUrl: award.photoUrl,
                        fit: BoxFit.cover,
                        placeholder: (ctx, url) => Container(
                          color: Colors.grey.shade800,
                          child: const Center(
                            child: Icon(Icons.photo_outlined, size: 24, color: Colors.white38),
                          ),
                        ),
                        errorWidget: (ctx, url, error) => Container(
                          color: Colors.grey.shade800,
                          child: const Icon(Icons.broken_image, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.75),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(10),
                        bottomRight: Radius.circular(8),
                      ),
                    ),
                    child: Text(
                      award.rankEmoji,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              // Award and Contest Information
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            award.awardTitle,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: award.tierColor,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                          ),
                          child: Text(
                            '⭐ ${award.finalScore.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.amber,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      award.submissionTitle,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      award.contestName,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (award.filmStock != null || award.camera != null) ...[
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          if (award.filmStock != null)
                            _buildMiniChip(context, Icons.movie_outlined, award.filmStock!),
                          if (award.camera != null)
                            _buildMiniChip(context, Icons.camera_alt_outlined, award.camera!),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniChip(BuildContext context, IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
