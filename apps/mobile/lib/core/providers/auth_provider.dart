import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthState {
  const AuthState({this.isLoggedIn = false});

  final bool isLoggedIn;
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  void login() => state = const AuthState(isLoggedIn: true);

  void logout() => state = const AuthState();
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);