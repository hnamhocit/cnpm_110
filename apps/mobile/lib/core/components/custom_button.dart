import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  const CustomButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isPrimary = true,
    this.isLoading = false,
    this.icon,
    this.width,
    this.height,
    this.color,
    this.borderRadius,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isPrimary;
  final bool isLoading;
  final Widget? icon;
  final double? width;
  final double? height;
  final Color? color;
  final double? borderRadius;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final radius = BorderRadius.circular(borderRadius ?? 12);
    final foregroundColor = color == null
        ? (isPrimary ? scheme.onPrimary : scheme.primary)
        : (color!.computeLuminance() > 0.5 ? Colors.black : Colors.white);
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading)
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: foregroundColor,
            ),
          )
        else if (icon != null)
          icon!,
        if (isLoading || icon != null) const SizedBox(width: 8),
        Text(label),
      ],
    );
    final buttonStyle = isPrimary
        ? FilledButton.styleFrom(
            backgroundColor: color,
            foregroundColor: foregroundColor,
            shape: RoundedRectangleBorder(borderRadius: radius),
          )
        : OutlinedButton.styleFrom(
            foregroundColor: color ?? scheme.primary,
            side: BorderSide(color: color ?? scheme.outline),
            shape: RoundedRectangleBorder(borderRadius: radius),
          );
    final button = isPrimary
        ? FilledButton(
            onPressed: isLoading ? null : onPressed,
            style: buttonStyle,
            child: content,
          )
        : OutlinedButton(
            onPressed: isLoading ? null : onPressed,
            style: buttonStyle,
            child: content,
          );

    return SizedBox(width: width, height: height, child: button);
  }
}
