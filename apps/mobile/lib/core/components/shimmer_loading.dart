import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Component bọc Shimmer với màu sắc tự động điều chỉnh theo Theme (Light / Dark)
class ShimmerLoading extends StatelessWidget {
  const ShimmerLoading({
    super.key,
    required this.child,
    this.baseColor,
    this.highlightColor,
  });

  final Widget child;
  final Color? baseColor;
  final Color? highlightColor;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultBaseColor = isDark
        ? const Color(0xFF2C2C2C)
        : const Color(0xFFE2E8F0);
    final defaultHighlightColor = isDark
        ? const Color(0xFF3F3F3F)
        : const Color(0xFFF8FAFC);

    return Shimmer.fromColors(
      baseColor: baseColor ?? defaultBaseColor,
      highlightColor: highlightColor ?? defaultHighlightColor,
      child: child,
    );
  }
}

/// Khung chữ nhật bo góc mô phỏng văn bản hoặc khung hình ảnh đang tải
class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 8.0,
    this.color,
    this.margin,
  });

  final double? width;
  final double? height;
  final double borderRadius;
  final Color? color;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

/// Khung tròn mô phỏng Avatar hoặc Huy hiệu đang tải
class SkeletonCircle extends StatelessWidget {
  const SkeletonCircle({
    super.key,
    this.radius = 24.0,
    this.color,
    this.margin,
  });

  final double radius;
  final Color? color;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: radius * 2,
      height: radius * 2,
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? Colors.white,
        shape: BoxShape.circle,
      ),
    );
  }
}

/// Placeholder hiệu ứng Shimmer hiển thị khi đang tải ảnh từ mạng
class ShimmerImagePlaceholder extends StatelessWidget {
  const ShimmerImagePlaceholder({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.showIcon = true,
  });

  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final bool showIcon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final placeholder = ShimmerLoading(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF242424) : const Color(0xFFE2E8F0),
          borderRadius: borderRadius ?? BorderRadius.zero,
        ),
        child: showIcon
            ? Center(
                child: Icon(
                  Icons.image_outlined,
                  size: (width != null && width! < 60) ? 20 : 32,
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                ),
              )
            : null,
      ),
    );

    if (borderRadius != null) {
      return ClipRRect(
        borderRadius: borderRadius!,
        child: placeholder,
      );
    }
    return placeholder;
  }
}

/// Skeleton mô phỏng 1 thẻ bài dự thi đoạt giải (Winner Card)
class WinnerCardSkeleton extends StatelessWidget {
  const WinnerCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 20),
      clipBehavior: Clip.antiAlias,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: colorScheme.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: ShimmerLoading(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Rank Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
              child: Row(
                children: const [
                  SkeletonCircle(radius: 12),
                  SizedBox(width: 10),
                  Expanded(child: SkeletonBox(height: 16)),
                  SizedBox(width: 10),
                  SkeletonBox(width: 50, height: 20, borderRadius: 10),
                ],
              ),
            ),

            // Photo Preview Placeholder (16:10 aspect ratio)
            const AspectRatio(
              aspectRatio: 16 / 10,
              child: SkeletonBox(
                width: double.infinity,
                height: double.infinity,
                borderRadius: 0,
              ),
            ),

            // Card Body Details
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonBox(width: 200, height: 18),
                  const SizedBox(height: 8),
                  const SkeletonBox(width: 120, height: 14),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: const [
                      SkeletonBox(width: 70, height: 22, borderRadius: 11),
                      SkeletonBox(width: 60, height: 22, borderRadius: 11),
                      SkeletonBox(width: 65, height: 22, borderRadius: 11),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const SkeletonBox(width: double.infinity, height: 36, borderRadius: 8),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Skeleton mô phỏng Bục vinh danh Top 3 (Podium)
class PodiumSkeleton extends StatelessWidget {
  const PodiumSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: ShimmerLoading(
        child: Column(
          children: [
            const SkeletonBox(width: 180, height: 18),
            const SizedBox(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Rank 2
                Expanded(
                  child: Column(
                    children: const [
                      SkeletonCircle(radius: 28),
                      SizedBox(height: 8),
                      SkeletonBox(width: 60, height: 12),
                      SizedBox(height: 6),
                      SkeletonBox(width: double.infinity, height: 120, borderRadius: 8),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Rank 1
                Expanded(
                  child: Column(
                    children: const [
                      SkeletonCircle(radius: 34),
                      SizedBox(height: 8),
                      SkeletonBox(width: 70, height: 14),
                      SizedBox(height: 6),
                      SkeletonBox(width: double.infinity, height: 150, borderRadius: 8),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Rank 3
                Expanded(
                  child: Column(
                    children: const [
                      SkeletonCircle(radius: 26),
                      SizedBox(height: 8),
                      SkeletonBox(width: 55, height: 12),
                      SizedBox(height: 6),
                      SkeletonBox(width: double.infinity, height: 100, borderRadius: 8),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Toàn bộ màn hình Skeleton Loading cho Winners Showcase
class WinnersShowcaseSkeleton extends StatelessWidget {
  const WinnersShowcaseSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      children: [
        // Header Banner Skeleton
        Padding(
          padding: const EdgeInsets.all(16),
          child: ShimmerLoading(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(width: 160, height: 14),
                  SizedBox(height: 10),
                  SkeletonBox(width: 240, height: 26),
                  SizedBox(height: 12),
                  SkeletonBox(width: double.infinity, height: 14),
                  SizedBox(height: 6),
                  SkeletonBox(width: 220, height: 14),
                  SizedBox(height: 14),
                  SkeletonBox(width: 180, height: 24, borderRadius: 12),
                ],
              ),
            ),
          ),
        ),

        // Podium Skeleton
        const PodiumSkeleton(),

        // Section Title
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
          child: ShimmerLoading(
            child: Row(
              children: const [
                SkeletonBox(width: 24, height: 24, borderRadius: 12),
                SizedBox(width: 10),
                SkeletonBox(width: 200, height: 18),
              ],
            ),
          ),
        ),

        // List of Winner Card Skeletons
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: const [
              WinnerCardSkeleton(),
              WinnerCardSkeleton(),
              WinnerCardSkeleton(),
            ],
          ),
        ),
      ],
    );
  }
}

/// Skeleton cho danh sách bài dự thi cá nhân (My Submissions)
class SubmissionsListSkeleton extends StatelessWidget {
  const SubmissionsListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading(
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  SkeletonCircle(radius: 12),
                  SizedBox(width: 8),
                  Expanded(child: SkeletonBox(height: 16)),
                  SizedBox(width: 8),
                  SkeletonBox(width: 70, height: 22, borderRadius: 11),
                ],
              ),
              SizedBox(height: 12),
              SkeletonBox(width: 220, height: 18),
              SizedBox(height: 8),
              SkeletonBox(width: 140, height: 14),
              SizedBox(height: 12),
              SkeletonBox(width: double.infinity, height: 120, borderRadius: 12),
            ],
          ),
        ),
      ),
    );
  }
}

/// Skeleton dạng lưới cho danh sách ảnh lớn (Photo Grid)
class PhotoGridSkeleton extends StatelessWidget {
  const PhotoGridSkeleton({
    super.key,
    this.itemCount = 6,
    this.crossAxisCount = 2,
    this.aspectRatio = 0.75,
  });

  final int itemCount;
  final int crossAxisCount;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading(
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: aspectRatio,
        ),
        itemCount: itemCount,
        itemBuilder: (context, index) {
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
          );
        },
      ),
    );
  }
}
