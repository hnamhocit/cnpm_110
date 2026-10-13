import 'package:flutter/material.dart';
import 'package:flutter_application_1/router/app_router.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Ứng dụng mẫu',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF386A5A)),
        scaffoldBackgroundColor: const Color(0xFFF7F8F7),
      ),
      routerConfig: appRouter,
    );
  }
}
