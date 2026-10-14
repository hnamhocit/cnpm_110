import 'package:flutter/widgets.dart';

class Validators {
  const Validators._();

  static String? notEmpty(String? value, {String field = 'Trường này'}) {
    if (value == null || value.trim().isEmpty) {
      return '$field không được để trống';
    }
    return null;
  }

  static String? email(String? value) {
    final error = notEmpty(value, field: 'Email');
    if (error != null) return error;
    final regex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!regex.hasMatch(value!.trim())) return 'Email không hợp lệ';
    return null;
  }

  static String? password(String? value) {
    final error = notEmpty(value, field: 'Mật khẩu');
    if (error != null) return error;
    if (value!.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    return null;
  }

  static String? Function(String?) confirmPassword(
    TextEditingController original,
  ) {
    return (value) {
      final error = notEmpty(value, field: 'Xác nhận mật khẩu');
      if (error != null) return error;
      if (value != original.text) return 'Mật khẩu xác nhận không khớp';
      return null;
    };
  }
}