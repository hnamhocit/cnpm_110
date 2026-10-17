import 'package:flutter/material.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Card(
          child: ListTile(
            leading: CircleAvatar(child: Icon(Icons.info_outline)),
            title: Text('Chào mừng bạn!'),
            subtitle: Text('Đây là nơi hiển thị các thông báo mới.'),
          ),
        ),
        Card(
          child: ListTile(
            leading: CircleAvatar(child: Icon(Icons.notifications_outlined)),
            title: Text('Chưa có thông báo mới'),
            subtitle: Text('Các cập nhật tiếp theo sẽ xuất hiện tại đây.'),
          ),
        ),
      ],
    );
  }
}
