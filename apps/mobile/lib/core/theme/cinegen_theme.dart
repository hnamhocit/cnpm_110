import 'package:flutter/material.dart';

const cinegenName = 'CINEGEN';
const cinegenInk = Color(0xFF06071B);
const cinegenPrimary = Color(0xFF4937BD);
const cinegenCyan = Color(0xFF126F92);
const cinegenViolet = Color(0xFF7B3BC6);

final cinegenTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: cinegenPrimary,
    primary: cinegenPrimary,
    onPrimary: Colors.white,
    secondary: cinegenCyan,
    tertiary: cinegenViolet,
  ),
);

class CinegenMark extends StatelessWidget {
  const CinegenMark({super.key, required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(size * 0.2),
      child: Image.asset(
        'assets/brand/cinegen.webp',
        width: size,
        height: size,
        excludeFromSemantics: true,
      ),
    );
  }
}
