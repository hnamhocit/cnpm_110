import 'package:flutter/material.dart';
import '../../core/components/cached_image_widget.dart';
import '../../core/components/shimmer_loading.dart';
import '../../models/contest_winner.dart';

/// Màn hình Chi tiết Ảnh Triển lãm / Tác phẩm Đạt giải (Photo Detail Screen)
/// Hỗ trợ:
/// - Hero Animation chuyển đổi mượt mà từ màn hình danh sách ảnh
/// - InteractiveViewer soi chi tiết hạt phim (film grain) và độ sắc nét analog
/// - Hiển thị 5 thông số kỹ thuật cốt lõi (BR-22: Film Stock, Camera, Lens, Format, Lab Scan)
/// - Watermark bảo vệ bản quyền triển lãm số (BR-17) & tính bất biến kết quả (BR-16)
class PhotoDetailScreen extends StatefulWidget {
  const PhotoDetailScreen({
    super.key,
    required this.winner,
    this.contestTitle,
  });

  final ContestWinner winner;
  final String? contestTitle;

  @override
  State<PhotoDetailScreen> createState() => _PhotoDetailScreenState();
}

class _PhotoDetailScreenState extends State<PhotoDetailScreen>
    with SingleTickerProviderStateMixin {
  final TransformationController _transformationController =
      TransformationController();
  late AnimationController _animController;
  Animation<Matrix4>? _animation;
  bool _showOverlay = true;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 240),
    )..addListener(() {
        if (_animation != null) {
          _transformationController.value = _animation!.value;
        }
      });
  }

  @override
  void dispose() {
    _transformationController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleDoubleTap(TapDownDetails details) {
    if (_animController.isAnimating) return;

    final currentScale = _transformationController.value.getMaxScaleOnAxis();
    Matrix4 endMatrix;

    if (currentScale > 1.2) {
      endMatrix = Matrix4.identity();
    } else {
      final position = details.localPosition;
      endMatrix = Matrix4.identity()
        ..translate(-position.dx * 1.5, -position.dy * 1.5)
        ..scale(2.5);
    }

    _animation = Matrix4Tween(
      begin: _transformationController.value,
      end: endMatrix,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));

    _animController.forward(from: 0);
  }

  void _toggleOverlay() {
    setState(() {
      _showOverlay = !_showOverlay;
    });
  }

  @override
  Widget build(BuildContext context) {
    final winner = widget.winner;
    final tier = winner.tier;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Khu vực ảnh tương tác toàn màn hình (Pinch-to-zoom & Pan)
          GestureDetector(
            onTap: _toggleOverlay,
            onDoubleTapDown: _handleDoubleTap,
            onDoubleTap: () {},
            child: SizedBox.expand(
              child: InteractiveViewer(
                transformationController: _transformationController,
                minScale: 0.8,
                maxScale: 5.0,
                child: Center(
                  child: Hero(
                    tag: 'winner_photo_${winner.submissionId}',
                    child: CachedImageWidget(
                      imageUrl: winner.photoUrl,
                      fit: BoxFit.contain,
                      useShimmer: true,
                      memCacheWidth: 2400,
                      memCacheHeight: 2400,
                      maxWidthDiskCache: 1920,
                      maxHeightDiskCache: 1920,
                      placeholder: (context, url) => const Center(
                        child: SizedBox(
                          width: 48,
                          height: 48,
                          child: ShimmerImagePlaceholder(showIcon: true),
                        ),
                      ),
                      errorWidget: (context, url, error) => Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.broken_image, color: Colors.grey, size: 64),
                            SizedBox(height: 12),
                            Text(
                              'Không thể tải hình ảnh phân giải cao',
                              style: TextStyle(color: Colors.white70, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Thanh điều hướng trên cùng (Top Navigation Overlay)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 220),
            top: _showOverlay ? 0 : -100,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(12, 40, 16, 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.85),
                    Colors.transparent,
                  ],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white, size: 26),
                      tooltip: 'Quay lại',
                      onPressed: () => Navigator.of(context).maybePop(),
                    ),
                    const SizedBox(width: 8),
                    // Rank & Award Chip
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: tier.primaryColor.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: tier.primaryColor.withValues(alpha: 0.7)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(winner.rankEmoji, style: const TextStyle(fontSize: 16)),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                winner.awardTitle,
                                style: TextStyle(
                                  color: tier.primaryColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Điểm số chính thức
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            winner.formattedScore,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Thanh thông tin chi tiết dưới cùng (Bottom Metadata Overlay)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 220),
            bottom: _showOverlay ? 0 : -260,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.95),
                    Colors.black.withValues(alpha: 0.8),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.7, 1.0],
                ),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Watermark BR-17 & BR-16 Badge
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white12,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.copyright, size: 12, color: Colors.white70),
                              SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  'FPC Exhibition Archive (BR-17)',
                                  style: TextStyle(color: Colors.white70, fontSize: 10),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (winner.isResultsLocked)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.green.withValues(alpha: 0.5)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified, size: 12, color: Colors.green),
                                SizedBox(width: 4),
                                Text(
                                  'BR-16 Locked',
                                  style: TextStyle(
                                    color: Colors.green,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Tên tác phẩm & Tác giả
                    Text(
                      winner.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Nhiếp ảnh gia: ${winner.authorName}',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 12),

                    // Analog Metadata Chips (BR-22)
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        if (winner.filmStock != null)
                          _buildMetadataChip(Icons.movie_filter_outlined, winner.filmStock!),
                        if (winner.camera != null)
                          _buildMetadataChip(Icons.camera_alt_outlined, winner.camera!),
                        if (winner.lens != null)
                          _buildMetadataChip(Icons.filter_tilt_shift_outlined, winner.lens!),
                        if (winner.filmFormat != null)
                          _buildMetadataChip(Icons.aspect_ratio_outlined, 'Khổ ${winner.filmFormat}'),
                        if (winner.developmentLab != null)
                          _buildMetadataChip(Icons.science_outlined, winner.developmentLab!),
                      ],
                    ),

                    // Nhận xét của Ban giám khảo nếu có
                    if (winner.juryCritique != null && winner.juryCritique!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white12),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.format_quote, size: 16, color: Colors.amber),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                winner.juryCritique!,
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                  fontStyle: FontStyle.italic,
                                  height: 1.35,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
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
    );
  }

  Widget _buildMetadataChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.amber),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
