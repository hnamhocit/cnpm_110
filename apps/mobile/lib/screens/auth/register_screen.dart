import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/components/custom_button.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/utils/validators.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    await Future<void>.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đăng ký thành công! Vui lòng đăng nhập.')),
    );
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Tạo tài khoản')),
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
                    Text(
                      'Đăng ký tham gia cuộc thi',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    CustomInputField(
                      controller: _nameController,
                      labelText: 'Họ và tên',
                      prefixIcon: const Icon(Icons.person_outline),
                      validator: (value) =>
                          Validators.notEmpty(value, field: 'Họ và tên'),
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
                      controller: _confirmController,
                      labelText: 'Xác nhận mật khẩu',
                      isPassword: true,
                      prefixIcon: const Icon(Icons.lock_reset_outlined),
                      validator: Validators.confirmPassword(_passwordController),
                    ),
                    const SizedBox(height: 24),
                    CustomButton(
                      label: 'Đăng ký',
                      height: 48,
                      isLoading: _isLoading,
                      onPressed: _submit,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Đã có tài khoản?'),
                        TextButton(
                          onPressed: () => context.go('/login'),
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