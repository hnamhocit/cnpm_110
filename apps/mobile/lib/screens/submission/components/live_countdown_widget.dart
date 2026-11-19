import 'dart:async';
import 'package:flutter/material.dart';

class LiveCountdownWidget extends StatefulWidget {
  const LiveCountdownWidget({
    super.key,
    required this.deadlineAt,
    this.onExpired,
    this.showIcon = true,
    this.textStyle,
    this.prefixText = 'Còn lại: ',
  });

  final DateTime deadlineAt;
  final VoidCallback? onExpired;
  final bool showIcon;
  final TextStyle? textStyle;
  final String prefixText;

  @override
  State<LiveCountdownWidget> createState() => _LiveCountdownWidgetState();
}

class _LiveCountdownWidgetState extends State<LiveCountdownWidget> {
  Timer? _timer;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _initRemaining();
    if (_remaining != Duration.zero) {
      _startTimer();
    }
  }

  void _initRemaining() {
    final now = DateTime.now();
    final diff = widget.deadlineAt.difference(now);
    if (diff.isNegative || diff == Duration.zero) {
      _remaining = Duration.zero;
    } else {
      // Ceiling division to nearest second so 10.0s doesn't truncate to 9s
      final totalSeconds = (diff.inMilliseconds + 999) ~/ 1000;
      _remaining = Duration(seconds: totalSeconds);
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      _tick();
    });
  }

  void _tick() {
    if (_remaining <= const Duration(seconds: 1)) {
      _timer?.cancel();
      if (mounted) {
        setState(() {
          _remaining = Duration.zero;
        });
        widget.onExpired?.call();
      }
    } else {
      if (mounted) {
        setState(() {
          _remaining = _remaining - const Duration(seconds: 1);
        });
      }
    }
  }

  @override
  void didUpdateWidget(LiveCountdownWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.deadlineAt != widget.deadlineAt) {
      _initRemaining();
      if (_remaining != Duration.zero) {
        _startTimer();
      } else {
        _timer?.cancel();
      }
      setState(() {});
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Color _getColor(ColorScheme colorScheme) {
    if (_remaining == Duration.zero) {
      return colorScheme.error;
    }
    final hours = _remaining.inHours;
    if (hours >= 12) {
      return Colors.green.shade700;
    } else if (hours >= 6) {
      return Colors.amber.shade900;
    } else {
      return colorScheme.error;
    }
  }

  String _formatDuration(Duration d) {
    if (d == Duration.zero) return '00:00:00 (Hết hạn)';
    final hours = d.inHours.toString().padLeft(2, '0');
    final minutes = (d.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = _getColor(colorScheme);
    final isUrgent = _remaining.inHours < 6 && _remaining != Duration.zero;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.showIcon) ...[
          Icon(
            isUrgent ? Icons.alarm_on_rounded : Icons.timer_outlined,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 4),
        ],
        Flexible(
          child: Text(
            '${widget.prefixText}${_formatDuration(_remaining)}',
            style: (widget.textStyle ?? Theme.of(context).textTheme.bodySmall)?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ),
      ],
    );
  }
}
