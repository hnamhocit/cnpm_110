import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/components/custom_button.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/providers/api_client_provider.dart';
import '../../core/utils/validators.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleChangePassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final dio = ref.read(apiClientProvider).dio;
      await dio.patch<dynamic>(
        '/api/v1/users/me/password',
        data: <String, dynamic>{
          'currentPassword': _currentPasswordController.text,
          'newPassword': _newPasswordController.text,
        },
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đổi mật khẩu thành công'),
        ),
      );
      Navigator.of(context).pop();
    } on DioException catch (e) {
      if (!mounted) return;
      final statusCode = e.response?.statusCode;
      final responseData = e.response?.data;
      String message;

      if (statusCode == 404) {
        message =
            'Máy chủ chưa hỗ trợ API đổi mật khẩu (/api/v1/users/me/password - 404).';
      } else if (responseData is Map && responseData['message'] != null) {
        message = responseData['message'].toString();
      } else if (responseData is Map && responseData['error'] != null) {
        message = responseData['error'].toString();
      } else {
        message = 'Đổi mật khẩu thất bại: ${e.message ?? 'Lỗi kết nối máy chủ'}';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi không xác định: $e'),
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
      appBar: AppBar(
        title: const Text('Đổi mật khẩu'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Thiết lập mật khẩu mới',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Mật khẩu mới phải có tối thiểu 8 ký tự và khác mật khẩu hiện tại.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              CustomInputField(
                controller: _currentPasswordController,
                isPassword: true,
                labelText: 'Mật khẩu hiện tại',
                hintText: 'Nhập mật khẩu đang dùng',
                prefixIcon: const Icon(Icons.lock_outline),
                validator: (value) =>
                    Validators.notEmpty(value, field: 'Mật khẩu hiện tại'),
              ),
              const SizedBox(height: 16),
              CustomInputField(
                controller: _newPasswordController,
                isPassword: true,
                labelText: 'Mật khẩu mới',
                hintText: 'Nhập mật khẩu mới (tối thiểu 8 ký tự)',
                prefixIcon: const Icon(Icons.lock_reset_outlined),
                validator: (value) {
                  final emptyError =
                      Validators.notEmpty(value, field: 'Mật khẩu mới');
                  if (emptyError != null) return emptyError;
                  if (value!.length < 8) {
                    return 'Mật khẩu phải có ít nhất 8 ký tự';
                  }
                  if (value.length > 128) {
                    return 'Mật khẩu không được vượt quá 128 ký tự';
                  }
                  if (value == _currentPasswordController.text) {
                    return 'Mật khẩu mới không được trùng với mật khẩu hiện tại';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomInputField(
                controller: _confirmPasswordController,
                isPassword: true,
                labelText: 'Xác nhận mật khẩu mới',
                hintText: 'Nhập lại mật khẩu mới',
                prefixIcon: const Icon(Icons.check_circle_outline),
                validator: (value) {
                  final emptyError =
                      Validators.notEmpty(value, field: 'Xác nhận mật khẩu');
                  if (emptyError != null) return emptyError;
                  if (value != _newPasswordController.text) {
                    return 'Mật khẩu xác nhận không khớp';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),
              CustomButton(
                label: 'Đổi mật khẩu',
                isLoading: _isLoading,
                onPressed: _isLoading ? null : _handleChangePassword,
                width: double.infinity,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
