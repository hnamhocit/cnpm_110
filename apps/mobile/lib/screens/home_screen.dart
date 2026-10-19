import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tapCount = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Xin chào!',
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Chào mừng bạn đến với Film Contest.',
          style: theme.textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        Card(
          elevation: 0,
          color: colorScheme.surfaceContainerHighest,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: colorScheme.outlineVariant),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: colorScheme.primaryContainer,
                      foregroundColor: colorScheme.onPrimaryContainer,
                      child: const Icon(Icons.photo_camera),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'FPC-43: Thông số chụp phim',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Camera body, Lens, Film stock, ISO, số frame',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  'Dựng và kiểm tra Form nhập thông số kỹ thuật chụp phim trước khi nộp bài thi ảnh.',
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => context.push('/film-params'),
                  icon: const Icon(Icons.edit_note_outlined),
                  label: const Text('Mở Form nhập thông số'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.waving_hand_outlined, color: colorScheme.primary),
                const SizedBox(height: 12),
                Text(
                  'Khu vực Trang chủ',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                const Text('Bạn có thể thay nội dung mẫu này bằng tính năng của mình.'),
                const SizedBox(height: 16),
                FilledButton.tonalIcon(
                  onPressed: () => setState(() => _tapCount++),
                  icon: const Icon(Icons.touch_app_outlined),
                  label: Text('Đã nhấn $_tapCount lần'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
