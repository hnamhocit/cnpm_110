import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/cinegen_theme.dart';
import '../../core/components/custom_button.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/utils/validators.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _codeController = TextEditingController();
  bool _verifying = false;
  String? _notice;
  bool _isLoading = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit({bool resend = false}) async {
    if (_isLoading || (!resend && !_formKey.currentState!.validate())) return;
    setState(() => _isLoading = true);

    try {
      final auth = ref.read(authProvider.notifier);
      final email = _emailController.text.trim();
      final password = _passwordController.text;
      if (_verifying && !resend) {
        await auth.verifyEmail(email, _codeController.text.trim());
        if (mounted) context.go('/login');
        return;
      }

      final deliveryStatus = resend
          ? await auth.resendVerification(email, password)
          : await auth.register(
              fullName: _fullNameController.text.trim(),
              email: email,
              password: password,
            );
      if (!mounted) return;
      setState(() {
        _verifying = true;
        _notice = deliveryStatus == 'RETRY_REQUIRED'
            ? 'Chưa gửi được mã. Vui lòng thử gửi lại sau.'
            : 'Kiểm tra mã xác thực trong hộp thư $email.';
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceAll('Exception: ', '')),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: CinegenMark(size: 72)),
                    const SizedBox(height: 16),
                    Text(
                      _verifying ? 'Xác thực email' : 'Đăng ký tài khoản',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (_verifying) ...[
                      if (_notice != null) Text(_notice!),
                      CustomInputField(
                        controller: _codeController,
                        labelText: 'Mã xác thực email',
                        keyboardType: TextInputType.number,
                        validator: (value) =>
                            RegExp(r'^\d{6}$').hasMatch(value?.trim() ?? '')
                            ? null
                            : 'Nhập mã xác thực gồm 6 chữ số',
                      ),
                    ] else ...[
                      CustomInputField(
                        controller: _fullNameController,
                        labelText: 'Họ và tên',
                        prefixIcon: const Icon(Icons.person_outline),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Vui lòng nhập họ và tên';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      CustomInputField(
                        controller: _emailController,
                        labelText: 'Email',
                        keyboardType: TextInputType.emailAddress,
                        prefixIcon: const Icon(Icons.email_outlined),
                        validator: Validators.email,
                      ),
                      const SizedBox(height: 16),
                      CustomInputField(
                        controller: _passwordController,
                        labelText: 'Mật khẩu',
                        isPassword: true,
                        prefixIcon: const Icon(Icons.lock_outline),
                        validator: Validators.password,
                      ),
                      const SizedBox(height: 16),
                      CustomInputField(
                        controller: _confirmPasswordController,
                        labelText: 'Xác nhận mật khẩu',
                        isPassword: true,
                        prefixIcon: const Icon(Icons.lock_outline),
                        validator: (value) {
                          if (value != _passwordController.text) {
                            return 'Mật khẩu không khớp';
                          }
                          return null;
                        },
                      ),
                    ],
                    const SizedBox(height: 24),
                    CustomButton(
                      label: _verifying ? 'Xác thực email' : 'Đăng ký',
                      height: 48,
                      isLoading: _isLoading,
                      onPressed: () => _submit(),
                    ),
                    if (_verifying)
                      TextButton(
                        onPressed: _isLoading
                            ? null
                            : () => _submit(resend: true),
                        child: const Text('Gửi lại mã'),
                      ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Đã có tài khoản?'),
                        TextButton(
                          onPressed: () => context.pop(),
                          child: const Text('Đăng nhập'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
