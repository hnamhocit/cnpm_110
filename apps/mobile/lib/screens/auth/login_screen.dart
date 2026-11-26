import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/cinegen_theme.dart';
import '../../core/components/custom_button.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/network/api_exception.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/utils/validators.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();
  bool _verifying = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final auth = ref.read(authProvider.notifier);
      if (_verifying) {
        await auth.verifyEmail(
          _emailController.text.trim(),
          _codeController.text.trim(),
        );
        if (!mounted) return;
        setState(() => _verifying = false);
        _codeController.clear();
      }
      await auth.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      context.go('/');
    } catch (error) {
      if (!mounted) return;
      if (error is ApiException &&
          error.statusCode == 401 &&
          error.message == 'EMAIL_VERIFICATION_REQUIRED') {
        setState(() => _verifying = true);
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(switch (error) {
            ApiException(message: 'ACCOUNT_LOCKED', statusCode: 403) =>
              'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
            ApiException(message: 'Invalid email or password', statusCode: 401) =>
              'Email hoặc mật khẩu không chính xác.',
            _ => error.toString().replaceAll('Exception: ', ''),
          }),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _resendVerification() async {
    setState(() => _isLoading = true);
    try {
      final result = await ref
          .read(authProvider.notifier)
          .resendVerification(
            _emailController.text.trim(),
            _passwordController.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result == 'RETRY_REQUIRED'
                ? 'Chưa gửi được mã. Vui lòng thử lại sau.'
                : 'Kiểm tra hộp thư để nhận mã xác thực.',
          ),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Chưa gửi được mã. Vui lòng thử lại sau.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPasswordReset() async {
    final email = _emailController.text.trim();
    final validationError = Validators.email(email);
    if (validationError != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(validationError)));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).requestPasswordReset(email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Nếu email đã xác minh, hãy kiểm tra hộp thư để đặt lại mật khẩu.',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) setState(() => _isLoading = false);
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
                      _verifying ? 'Xác thực email' : 'Đăng nhập',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (_verifying) ...[
                      Text(
                        'Nhập mã xác thực cho ${_emailController.text.trim()}.',
                      ),
                      const SizedBox(height: 16),
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
                    ],
                    const SizedBox(height: 24),
                    CustomButton(
                      label: _verifying ? 'Xác thực và đăng nhập' : 'Đăng nhập',
                      height: 48,
                      isLoading: _isLoading,
                      onPressed: _submit,
                    ),
                    if (_verifying) ...[
                      TextButton(
                        onPressed: _isLoading ? null : _resendVerification,
                        child: const Text('Gửi lại mã'),
                      ),
                      TextButton(
                        onPressed: _isLoading
                            ? null
                            : () {
                                _codeController.clear();
                                setState(() => _verifying = false);
                              },
                        child: const Text('Quay lại đăng nhập'),
                      ),
                    ] else ...[
                      TextButton(
                        onPressed: _isLoading ? null : _requestPasswordReset,
                        child: const Text('Quên mật khẩu?'),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Chưa có tài khoản?'),
                          TextButton(
                            onPressed: () => context.push('/register'),
                            child: const Text('Đăng ký'),
                          ),
                        ],
                      ),
                    ],
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
