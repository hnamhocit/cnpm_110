import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/components/cached_image_widget.dart';
import '../../core/components/shimmer_loading.dart';
import '../../core/providers/contest_provider.dart';
import '../../core/services/contest_cache_manager.dart';
import '../../core/utils/page_transitions.dart';
import '../../models/contest_winner.dart';
import 'photo_detail_screen.dart';

/// Màn hình Bảng vàng vinh danh (Winners Showcase - FPC-100 / SCR-PAR-08)
/// Tuân thủ:
/// - BR-16 (Result Immutability): Điểm số và thông tin giải thưởng đã công bố là bất biến
/// - BR-17 (Archive Image Protection): Hiển thị bản ảnh triển lãm có bản quyền
/// - BR-06 (Negative Proof Verification): Tác phẩm đoạt giải đã xác minh bằng chứng âm bản
/// - BR-22 (Analog Metadata): Hiển thị 5 trường thông số kỹ thuật cốt lõi
class WinnersShowcaseScreen extends ConsumerStatefulWidget {
  const WinnersShowcaseScreen({
    super.key,
    required this.contestId,
    this.contestTitle,
  });

  final String contestId;
  final String? contestTitle;

  @override
  ConsumerState<WinnersShowcaseScreen> createState() =>
      _WinnersShowcaseScreenState();
}

class _WinnersShowcaseScreenState extends ConsumerState<WinnersShowcaseScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _openPhotoDetail(BuildContext context, ContestWinner winner) {
    try {
      context.push(
        '/contests/${widget.contestId}/winners/${winner.submissionId}',
        extra: winner,
      );
    } catch (_) {
      Navigator.of(context).push(
        AppTransitions.buildPageRoute(
          page: PhotoDetailScreen(
            winner: winner,
            contestTitle: widget.contestTitle,
          ),
          isDetail: true,
        ),
      );
    }
  }

  void _showImageLightbox(BuildContext context, ContestWinner winner) {
    showDialog<void>(
      context: context,
      builder: (dialogCtx) => Dialog.fullscreen(
        backgroundColor: Colors.black.withValues(alpha: 0.95),
        child: Stack(
          children: [
            // Interactive viewer for zoom & grain inspection
            Center(
              child: InteractiveViewer(
                minScale: 0.8,
                maxScale: 4.0,
                child: CachedImageWidget(
                  imageUrl: winner.photoUrl,
                  fit: BoxFit.contain,
                  memCacheWidth: 2000,
                  memCacheHeight: 2000,
                  placeholder: (ctx, url) => const Center(
                    child: CircularProgressIndicator(color: Colors.amber),
                  ),
                  errorWidget: (ctx, url, error) => const Center(
                    child: Icon(Icons.broken_image, color: Colors.grey, size: 64),
                  ),
                ),
              ),
            ),

            // Top action bar
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
                        border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(winner.rankEmoji, style: const TextStyle(fontSize: 18)),
                          const SizedBox(width: 8),
                          Text(
                            winner.awardTitle,
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
                      onPressed: () => Navigator.of(dialogCtx).pop(),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom metadata bar
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: SafeArea(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.75),
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
                              winner.title,
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
                              '⭐ ${winner.formattedScore}',
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
                        'Tác giả: ${winner.authorName}',
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                      if (winner.filmStock != null || winner.camera != null) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            if (winner.filmStock != null)
                              _buildMiniBadge(Icons.movie_filter_outlined, winner.filmStock!),
                            if (winner.camera != null)
                              _buildMiniBadge(Icons.camera_alt_outlined, winner.camera!),
                            if (winner.filmFormat != null)
                              _buildMiniBadge(Icons.aspect_ratio_outlined, 'Khổ ${winner.filmFormat}'),
                            if (winner.developmentLab != null)
                              _buildMiniBadge(Icons.science_outlined, winner.developmentLab!),
                          ],
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
    final resultsAsync = ref.watch(contestResultsProvider(widget.contestId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bảng Vàng Vinh Danh'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            tooltip: 'Quy chế kết quả (BR-16)',
            onPressed: () {
              showModalBottomSheet<void>(
                context: context,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                builder: (ctx) => Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.verified, color: Colors.amber, size: 28),
                          const SizedBox(width: 12),
                          Text(
                            'Quy định Bảng vàng Vinh danh',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        '• BR-16 (Result Immutability): Toàn bộ điểm số, thứ hạng và thông tin giải thưởng đã được công bố chính thức và khóa vĩnh viễn (Read-Only).\n'
                        '• BR-06 (Negative Proof): Mọi tác phẩm đạt giải đều đã qua khâu thẩm định đối chiếu cuộn phim/bằng chứng âm bản vật lý.\n'
                        '• BR-17 (Digital Heritage): Các tác phẩm được số hóa và lưu trữ tại kho di sản triển lãm FPC.',
                        style: TextStyle(height: 1.5),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          child: const Text('Đã hiểu'),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: resultsAsync.when(
        loading: () => const WinnersShowcaseSkeleton(),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.emoji_events_outlined, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  'Chưa thể tải kết quả vinh danh',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  error.toString().replaceFirst('Exception: ', ''),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: colorScheme.error),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => ref.invalidate(contestResultsProvider(widget.contestId)),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
        data: (results) {
          if (results.winners.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.military_tech_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    Text(
                      'Chưa có danh sách đạt giải',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Ban giám khảo đang trong quá trình thẩm định và chấm điểm chung kết.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          // Precache trước 5 ảnh đầu tiên để cuộn siêu mượt không khựng
          for (var i = 0; i < results.winners.length && i < 5; i++) {
            ContestCacheManager.precache(
              context,
              results.winners[i].photoUrl,
              isThumbnail: true,
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(contestResultsProvider(widget.contestId));
              await ref.read(contestResultsProvider(widget.contestId).future);
            },
            child: CustomScrollView(
              controller: _scrollController,
              cacheExtent: 600,
              slivers: [
                // Top Header Banner
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF1A1A1A),
                          colorScheme.primary.withValues(alpha: 0.15),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.amber.withValues(alpha: 0.4),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text('🏆', style: TextStyle(fontSize: 26)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    results.contestName.toUpperCase(),
                                    style: theme.textTheme.labelMedium?.copyWith(
                                      color: Colors.amber,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.2,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    'Bảng Vàng Vinh Danh',
                                    style: theme.textTheme.headlineSmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Tôn vinh các kiệt tác nhiếp ảnh phim analog xuất sắc nhất vượt qua quy trình thẩm duyệt khắt khe và đạt số điểm cao nhất từ Hội đồng Giám khảo.',
                          style: TextStyle(fontSize: 13, height: 1.4),
                        ),
                        const SizedBox(height: 14),
                        // BR-16 Immutability Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.green.withValues(alpha: 0.5)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.lock_outline, size: 14, color: Colors.green),
                              SizedBox(width: 6),
                              Text(
                                'BR-16: Kết quả chính thức đã khóa (Read-Only)',
                                style: TextStyle(
                                  color: Colors.green,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Top 3 Podium
                if (results.podiumWinners.isNotEmpty)
                  SliverToBoxAdapter(
                    child: _buildPodiumSection(context, results),
                  ),

                // Section Title: Danh sách đầy đủ
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                    child: Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Danh Sách Tác Phẩm Đạt Giải (${results.winners.length})',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Winner Cards List (Tối ưu hóa render danh sách lớn)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final winner = results.winners[index];
                        return RepaintBoundary(
                          child: _buildWinnerCard(context, winner),
                        );
                      },
                      childCount: results.winners.length,
                      addAutomaticKeepAlives: true,
                      addRepaintBoundaries: true,
                    ),
                  ),
                ),

                const SliverToBoxAdapter(
                  child: SizedBox(height: 32),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Bục vinh danh Top 3 (Podium)
  Widget _buildPodiumSection(BuildContext context, ContestResults results) {
    final gold = results.goldWinner;
    final silver = results.silverWinner;
    final bronze = results.bronzeWinner;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Text('🎖️', style: TextStyle(fontSize: 18)),
              SizedBox(width: 6),
              Text(
                'TOP 3 KIỆT TÁC DẪN ĐẦU',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.1,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // 2nd Place (Silver)
              Expanded(
                child: silver != null
                    ? _buildPodiumColumn(context, silver, height: 130)
                    : const SizedBox.shrink(),
              ),
              const SizedBox(width: 8),
              // 1st Place (Gold)
              Expanded(
                child: gold != null
                    ? _buildPodiumColumn(context, gold, height: 160, isCenter: true)
                    : const SizedBox.shrink(),
              ),
              const SizedBox(width: 8),
              // 3rd Place (Bronze)
              Expanded(
                child: bronze != null
                    ? _buildPodiumColumn(context, bronze, height: 110)
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumColumn(
    BuildContext context,
    ContestWinner winner, {
    required double height,
    bool isCenter = false,
  }) {
    final tier = winner.tier;

    return InkWell(
      onTap: () => _openPhotoDetail(context, winner),
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Photo with border
          Stack(
            alignment: Alignment.topRight,
            children: [
              Container(
                width: isCenter ? 76 : 64,
                height: isCenter ? 76 : 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: tier.primaryColor,
                    width: isCenter ? 3 : 2,
                  ),
                  boxShadow: isCenter
                      ? [
                          BoxShadow(
                            color: Colors.amber.withValues(alpha: 0.4),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ]
                      : null,
                ),
                child: ClipOval(
                  child: CachedImageWidget(
                    imageUrl: winner.photoUrl,
                    fit: BoxFit.cover,
                    useShimmer: true,
                    memCacheWidth: 200,
                    memCacheHeight: 200,
                    maxWidthDiskCache: 600,
                    maxHeightDiskCache: 600,
                    placeholder: (ctx, url) => const ShimmerImagePlaceholder(
                      showIcon: false,
                    ),
                    errorWidget: (ctx, url, error) => Container(
                      color: Colors.grey.shade800,
                      child: const Icon(Icons.image, color: Colors.white38),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    shape: BoxShape.circle,
                  ),
                  child: Text(winner.rankEmoji, style: TextStyle(fontSize: isCenter ? 18 : 14)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            winner.title,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: isCenter ? 12 : 11,
            ),
          ),
          Text(
            winner.authorName,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 6),
          // Podium Stand
          Container(
            height: height,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  tier.primaryColor.withValues(alpha: isCenter ? 0.35 : 0.2),
                  tier.primaryColor.withValues(alpha: 0.05),
                ],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
              border: Border.all(
                color: tier.primaryColor.withValues(alpha: 0.4),
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '#${winner.awardRank}',
                  style: TextStyle(
                    fontSize: isCenter ? 26 : 20,
                    fontWeight: FontWeight.bold,
                    color: tier.primaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${winner.finalScore.toStringAsFixed(2)}đ',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: tier.primaryColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Thẻ hiển thị chi tiết từng tác phẩm đạt giải
  Widget _buildWinnerCard(BuildContext context, ContestWinner winner) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final tier = winner.tier;

    return Card(
      margin: const EdgeInsets.only(bottom: 20),
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: winner.isGold
              ? Colors.amber.withValues(alpha: 0.6)
              : colorScheme.outlineVariant,
          width: winner.isGold ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card Header: Rank Chip + Final Score
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: tier.primaryColor.withValues(alpha: 0.12),
              border: Border(
                bottom: BorderSide(color: tier.primaryColor.withValues(alpha: 0.25)),
              ),
            ),
            child: Row(
              children: [
                Text(winner.rankEmoji, style: const TextStyle(fontSize: 20)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    winner.awardTitle,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: tier.primaryColor,
                    ),
                  ),
                ),
                // Score Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: tier.primaryColor),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.star, size: 14, color: Colors.amber),
                      const SizedBox(width: 4),
                      Text(
                        winner.formattedScore,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Photo Preview with Watermark Overlay (BR-17)
          GestureDetector(
            onTap: () => _openPhotoDetail(context, winner),
            child: Stack(
              children: [
                Hero(
                  tag: 'winner_photo_${winner.submissionId}',
                  child: AspectRatio(
                    aspectRatio: 16 / 10,
                    child: CachedImageWidget(
                      imageUrl: winner.photoUrl,
                      fit: BoxFit.cover,
                      useShimmer: true,
                      memCacheWidth: 800,
                      memCacheHeight: 500,
                      maxWidthDiskCache: 800,
                      maxHeightDiskCache: 800,
                      placeholder: (ctx, url) => const ShimmerImagePlaceholder(
                        borderRadius: BorderRadius.zero,
                        showIcon: true,
                      ),
                      errorWidget: (ctx, url, error) => Container(
                        color: colorScheme.surfaceContainerHighest,
                        child: const Center(
                          child: Icon(Icons.broken_image, size: 48, color: Colors.grey),
                        ),
                      ),
                    ),
                  ),
                ),

                // BR-17 Exhibition Watermark overlay
                Positioned(
                  left: 12,
                  bottom: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.copyright, size: 12, color: Colors.white70),
                        SizedBox(width: 4),
                        Text(
                          'FPC Exhibition Archive (BR-17)',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Tap to zoom hint
                Positioned(
                  right: 12,
                  bottom: 12,
                  child: InkWell(
                    onTap: () => _openPhotoDetail(context, winner),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.zoom_in, size: 14, color: Colors.white),
                          SizedBox(width: 4),
                          Text(
                            'Xem lớn',
                            style: TextStyle(color: Colors.white, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  winner.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),

                // Author
                Row(
                  children: [
                    Icon(Icons.person_pin, size: 16, color: colorScheme.primary),
                    const SizedBox(width: 6),
                    Text(
                      'Tác giả: ${winner.authorName}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Analog Metadata Chips (BR-22: 5 metadata fields)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (winner.filmStock != null)
                      _buildAnalogChip(context, Icons.movie_outlined, 'Phim', winner.filmStock!),
                    if (winner.camera != null)
                      _buildAnalogChip(context, Icons.camera_alt_outlined, 'Máy', winner.camera!),
                    if (winner.lens != null)
                      _buildAnalogChip(context, Icons.center_focus_strong_outlined, 'Lens', winner.lens!),
                    if (winner.filmFormat != null)
                      _buildAnalogChip(context, Icons.aspect_ratio_outlined, 'Khổ', winner.filmFormat!),
                    if (winner.developmentLab != null)
                      _buildAnalogChip(context, Icons.science_outlined, 'Lab', winner.developmentLab!),
                  ],
                ),
                const SizedBox(height: 14),

                // Verified Badges (BR-06 & BR-16)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Bằng chứng âm bản đã xác minh (BR-06)',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Colors.green.shade800,
                          ),
                        ),
                      ),
                      const Icon(Icons.lock, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        'Đã khóa (BR-16)',
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                      ),
                    ],
                  ),
                ),

                // Jury Critique Box (SCR-PAR-08)
                if (winner.juryCritique != null && winner.juryCritique!.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.format_quote, size: 18, color: Colors.amber),
                            SizedBox(width: 6),
                            Text(
                              'Nhận xét từ Hội đồng Giám khảo',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: Colors.amber,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '"${winner.juryCritique}"',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontStyle: FontStyle.italic,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalogChip(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colorScheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: colorScheme.primary),
          const SizedBox(width: 4),
          Text(
            '$label: ',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
