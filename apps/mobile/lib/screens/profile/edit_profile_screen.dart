import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/components/custom_button.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/providers/api_client_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/utils/validators.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final authState = ref.read(authProvider);
    _nameController = TextEditingController(text: authState.fullName ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final dio = ref.read(apiClientProvider).dio;
      await dio.put<dynamic>(
        '/api/v1/users/me/profile',
        data: <String, dynamic>{
          'fullName': _nameController.text.trim(),
        },
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cập nhật thông tin thành công'),
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
            'Máy chủ chưa hỗ trợ API cập nhật hồ sơ (/api/v1/users/me/profile - 404).';
      } else if (responseData is Map && responseData['message'] != null) {
        message = responseData['message'].toString();
      } else if (responseData is Map && responseData['error'] != null) {
        message = responseData['error'].toString();
      } else {
        message = 'Cập nhật thất bại: ${e.message ?? 'Lỗi kết nối máy chủ'}';
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
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cập nhật thông tin'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Thông tin tài khoản',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              CustomInputField(
                controller: _nameController,
                labelText: 'Họ và tên',
                hintText: 'Nhập họ và tên đầy đủ',
                prefixIcon: const Icon(Icons.person_outline),
                validator: (value) {
                  final emptyError =
                      Validators.notEmpty(value, field: 'Họ và tên');
                  if (emptyError != null) return emptyError;
                  if (value!.trim().length < 2) {
                    return 'Họ và tên phải có ít nhất 2 ký tự';
                  }
                  if (value.trim().length > 100) {
                    return 'Họ và tên tối đa 100 ký tự';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: authState.email ?? '',
                enabled: false,
                decoration: InputDecoration(
                  labelText: 'Email',
                  prefixIcon: const Icon(Icons.email_outlined),
                  helperText:
                      'Email là định danh tài khoản và không thể chỉnh sửa (BR-01)',
                  filled: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(
                    'Vai trò:',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Chip(
                    label: Text(authState.role ?? 'PARTICIPANT'),
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
              const SizedBox(height: 32),
              CustomButton(
                label: 'Lưu thay đổi',
                isLoading: _isLoading,
                onPressed: _isLoading ? null : _handleSave,
                width: double.infinity,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
