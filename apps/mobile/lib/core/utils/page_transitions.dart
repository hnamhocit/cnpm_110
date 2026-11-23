import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Tiện ích cung cấp các hiệu ứng chuyển trang (Page Transition) mượt mà cho GoRouter và Navigator
class AppTransitions {
  const AppTransitions._();

  /// Thời gian hiệu ứng chuyển tiếp trang chuẩn
  static const Duration defaultDuration = Duration(milliseconds: 350);
  static const Duration defaultReverseDuration = Duration(milliseconds: 300);

  /// Tạo CustomTransitionPage kết hợp trượt nhẹ từ dưới lên và mờ dần (Slide Up + Fade)
  /// Phù hợp khi mở các màn hình danh sách lớn, thư viện ảnh (Photo Gallery / Winners Showcase)
  static CustomTransitionPage<T> slideUpFade<T>({
    required LocalKey key,
    required Widget child,
    Duration duration = defaultDuration,
    Duration reverseDuration = defaultReverseDuration,
    Curve curve = Curves.easeOutCubic,
    Curve reverseCurve = Curves.easeInCubic,
  }) {
    return CustomTransitionPage<T>(
      key: key,
      child: child,
      transitionDuration: duration,
      reverseTransitionDuration: reverseDuration,
      transitionsBuilder: (context, animation, secondaryAnimation, childWidget) {
        final curvedAnimation = CurvedAnimation(
          parent: animation,
          curve: curve,
          reverseCurve: reverseCurve,
        );

        final slideAnimation = Tween<Offset>(
          begin: const Offset(0.0, 0.08),
          end: Offset.zero,
        ).animate(curvedAnimation);

        final fadeAnimation = Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(curvedAnimation);

        return SlideTransition(
          position: slideAnimation,
          child: FadeTransition(
            opacity: fadeAnimation,
            child: childWidget,
          ),
        );
      },
    );
  }

  /// Tạo CustomTransitionPage kết hợp phóng to nhẹ và mờ dần (Scale + Fade)
  /// Phù hợp tối đa khi mở màn hình chi tiết ảnh (Photo Detail) có kết hợp Hero Animation
  static CustomTransitionPage<T> fadeScale<T>({
    required LocalKey key,
    required Widget child,
    Duration duration = const Duration(milliseconds: 380),
    Duration reverseDuration = const Duration(milliseconds: 300),
    Curve curve = Curves.easeOutCubic,
    Curve reverseCurve = Curves.easeInCubic,
  }) {
    return CustomTransitionPage<T>(
      key: key,
      child: child,
      transitionDuration: duration,
      reverseTransitionDuration: reverseDuration,
      transitionsBuilder: (context, animation, secondaryAnimation, childWidget) {
        final curvedAnimation = CurvedAnimation(
          parent: animation,
          curve: curve,
          reverseCurve: reverseCurve,
        );

        final scaleAnimation = Tween<double>(
          begin: 0.94,
          end: 1.0,
        ).animate(curvedAnimation);

        final fadeAnimation = Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(curvedAnimation);

        return FadeTransition(
          opacity: fadeAnimation,
          child: ScaleTransition(
            scale: scaleAnimation,
            child: childWidget,
          ),
        );
      },
    );
  }

  /// PageRouteBuilder cho Navigator.push truyền thống (khi không gọi qua GoRouter)
  static PageRouteBuilder<T> buildPageRoute<T>({
    required Widget page,
    RouteSettings? settings,
    bool isDetail = false,
  }) {
    return PageRouteBuilder<T>(
      settings: settings,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionDuration: isDetail
          ? const Duration(milliseconds: 380)
          : defaultDuration,
      reverseTransitionDuration: defaultReverseDuration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final curve = isDetail ? Curves.easeOutCubic : Curves.easeOutQuart;
        final curvedAnimation = CurvedAnimation(
          parent: animation,
          curve: curve,
          reverseCurve: Curves.easeInCubic,
        );

        if (isDetail) {
          return FadeTransition(
            opacity: Tween<double>(begin: 0.0, end: 1.0).animate(curvedAnimation),
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.95, end: 1.0).animate(curvedAnimation),
              child: child,
            ),
          );
        }

        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, 0.06),
            end: Offset.zero,
          ).animate(curvedAnimation),
          child: FadeTransition(
            opacity: Tween<double>(begin: 0.0, end: 1.0).animate(curvedAnimation),
            child: child,
          ),
        );
      },
    );
  }
}
