import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tapCount = 0;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Xin chào!',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Chào mừng bạn đến với ứng dụng mẫu.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
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
                  style: Theme.of(context).textTheme.titleLarge,
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
