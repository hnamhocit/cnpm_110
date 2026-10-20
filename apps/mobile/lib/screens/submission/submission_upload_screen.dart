import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/components/custom_button.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/data/submission_repository.dart';
import '../../core/network/api_exception.dart';
import '../../core/services/image_picker_service.dart';
import '../../models/film_dev_scan_params.dart';
import '../../models/film_shooting_params.dart';
import '../../models/image_attachment.dart';
import '../../models/submission_data.dart';
import '../film_dev_scan/film_dev_scan_screen.dart';
import '../film_params/film_params_screen.dart';
import 'components/image_picker_card.dart';
import 'components/image_preview_dialog.dart';

class SubmissionUploadScreen extends ConsumerStatefulWidget {
  const SubmissionUploadScreen({
    super.key,
    this.contestId,
    this.contestTitle,
    this.categoryId,
    this.initialShootingParams,
    this.initialDevScanParams,
    this.onSubmissionSuccess,
  });

  final String? contestId;
  final String? contestTitle;
  final String? categoryId;
  final FilmShootingParams? initialShootingParams;
  final FilmDevScanParams? initialDevScanParams;
  final ValueChanged<SubmissionResult>? onSubmissionSuccess;

  @override
  ConsumerState<SubmissionUploadScreen> createState() =>
      _SubmissionUploadScreenState();
}

class _SubmissionUploadScreenState
    extends ConsumerState<SubmissionUploadScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _titleController;
  late final TextEditingController _descController;

  ImageAttachment? _scanImage;
  ImageAttachment? _negativeProof;

  String? _scanImageError;
  String? _negativeProofError;

  FilmShootingParams? _shootingParams;
  FilmDevScanParams? _devScanParams;

  bool _isSubmitting = false;

  static const int _maxScanBytes = 100 * 1024 * 1024; // 100 MiB
  static const int _maxProofBytes = 20 * 1024 * 1024; // 20 MiB

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descController = TextEditingController();

    _shootingParams = widget.initialShootingParams ??
        const FilmShootingParams(
          cameraBody: 'Leica M6',
          filmBrand: 'Kodak',
          filmStock: 'Portra 400',
          filmFormat: '35mm',
          isoRated: 400,
          isoShot: 400,
        );

    _devScanParams = widget.initialDevScanParams ??
        const FilmDevScanParams(
          labName: 'Llab',
          scannerModel: 'Noritsu HS-1800',
          scanResolution: 'Tiêu chuẩn (2000 x 3000 ~ 6MP)',
        );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _pickScanImage(ImageSource source) async {
    try {
      final picker = ref.read(imagePickerServiceProvider);
      final attachment = await picker.pickAttachment(source: source);

      if (attachment == null) return;

      if (attachment.sizeInBytes > _maxScanBytes) {
        setState(() {
          _scanImageError =
              'Ảnh scan vượt quá dung lượng tối đa 100MB (${attachment.formattedSize}).';
        });
        return;
      }

      setState(() {
        _scanImage = attachment;
        _scanImageError = null;
      });
    } catch (e) {
      setState(() {
        _scanImageError = 'Không thể chọn ảnh: $e';
      });
    }
  }

  Future<void> _pickNegativeProof(ImageSource source) async {
    try {
      final picker = ref.read(imagePickerServiceProvider);
      final attachment = await picker.pickAttachment(source: source);

      if (attachment == null) return;

      if (attachment.sizeInBytes > _maxProofBytes) {
        setState(() {
          _negativeProofError =
              'Ảnh âm bản vượt quá dung lượng tối đa 20MB (${attachment.formattedSize}).';
        });
        return;
      }

      setState(() {
        _negativeProof = attachment;
        _negativeProofError = null;
      });
    } catch (e) {
      setState(() {
        _negativeProofError = 'Không thể chọn ảnh âm bản: $e';
      });
    }
  }

  void _previewImage(ImageAttachment attachment, String title) {
    ImagePreviewDialog.show(
      context,
      attachment: attachment,
      title: title,
    );
  }

  void _resetForm() {
    setState(() {
      _titleController.clear();
      _descController.clear();
      _scanImage = null;
      _negativeProof = null;
      _scanImageError = null;
      _negativeProofError = null;
    });
  }

  Future<void> _submitForm() async {
    final formValid = _formKey.currentState?.validate() ?? false;

    if (_scanImage == null) {
      setState(() {
        _scanImageError = 'Vui lòng chọn ảnh scan bài dự thi (bắt buộc).';
      });
      return;
    }

    if (!formValid) return;

    setState(() => _isSubmitting = true);

    try {
      final submissionData = SubmissionData(
        contestId: widget.contestId ?? '00000000-0000-0000-0000-000000000001',
        categoryId: widget.categoryId ?? '00000000-0000-0000-0000-000000000001',
        title: _titleController.text.trim(),
        description: _descController.text.trim().isNotEmpty
            ? _descController.text.trim()
            : null,
        scanImage: _scanImage!,
        negativeProof: _negativeProof,
        shootingParams: _shootingParams,
        devScanParams: _devScanParams,
      );

      final repo = ref.read(submissionRepositoryProvider);
      final result = await repo.uploadSubmission(submissionData);

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      widget.onSubmissionSuccess?.call(result);
      _showSuccessDialog(result);
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);

      final message = error is ApiException
          ? error.message
          : 'Lỗi nộp bài thi: $error';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  void _showSuccessDialog(SubmissionResult result) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          icon: Icon(
            Icons.check_circle_rounded,
            color: colorScheme.primary,
            size: 52,
          ),
          title: const Text('Nộp bài thi thành công!'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tác phẩm "${result.title}" đã được tải lên hệ thống Film Contest.',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Mã bài nộp: ${result.id.isNotEmpty ? result.id : "FPC-SUB"}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Trạng thái: PENDING_AI (Chờ thẩm định & chấm điểm)',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (result.negativeProofPath != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Đã đính kèm ảnh âm bản minh chứng.',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go('/');
                }
              },
              child: const Text('Hoàn tất & Về trang chủ'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nộp bài thi ảnh'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Đặt lại form',
            onPressed: _isSubmitting ? null : _resetForm,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          children: [
            // Contest banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.emoji_events_outlined,
                    size: 32,
                    color: colorScheme.onPrimaryContainer,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.contestTitle ?? 'Cuộc thi nhiếp ảnh phim',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: colorScheme.onPrimaryContainer,
                          ),
                        ),
                        Text(
                          'FPC-45: Đính kèm ảnh scan & âm bản minh chứng',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onPrimaryContainer
                                .withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Section 1: Artwork Info
            Text(
              '1. Thông tin tác phẩm',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            CustomInputField(
              controller: _titleController,
              labelText: 'Tiêu đề tác phẩm *',
              hintText: 'Nhập tên tác phẩm dự thi...',
              prefixIcon: const Icon(Icons.title),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Vui lòng nhập tiêu đề tác phẩm';
                }
                if (value.trim().length > 255) {
                  return 'Tiêu đề không được vượt quá 255 ký tự';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            CustomInputField(
              controller: _descController,
              labelText: 'Mô tả / Câu chuyện tác phẩm',
              hintText: 'Kể về khoảnh khắc hoặc cảm xúc khi chụp bức ảnh này...',
              prefixIcon: const Icon(Icons.notes),
              maxLines: 3,
              validator: (value) {
                if (value != null && value.length > 5000) {
                  return 'Mô tả không được vượt quá 5000 ký tự';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),

            // Section 2: Scan Image (Mandatory)
            Text(
              '2. Tải lên ảnh scan bài dự thi',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ImagePickerCard(
              title: 'Ảnh scan bài thi',
              subtitle: 'Bắt buộc • Tối đa 100MB',
              helperText:
                  'Ảnh scan chất lượng cao từ lab tráng scan hoặc scan cá nhân. Khuyến nghị độ phân giải tối thiểu 1000x1000px.',
              attachment: _scanImage,
              isRequired: true,
              errorMessage: _scanImageError,
              icon: Icons.photo_size_select_actual_outlined,
              onPickRequested: _pickScanImage,
              onRemove: () {
                setState(() {
                  _scanImage = null;
                  _scanImageError = null;
                });
              },
              onPreview: _scanImage != null
                  ? () => _previewImage(_scanImage!, 'Xem trước ảnh scan bài thi')
                  : null,
            ),
            const SizedBox(height: 24),

            // Section 3: Negative Proof / Contact Sheet (Optional)
            Text(
              '3. Đính kèm ảnh âm bản (Negative / Contact Sheet)',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ImagePickerCard(
              title: 'Ảnh âm bản / Contact Sheet',
              subtitle: 'Tùy chọn • Tối đa 20MB',
              helperText:
                  'Đính kèm ảnh chụp dải phim âm bản (negative strip) hoặc contact sheet để ban tổ chức và AI xác thực bài thi được chụp bằng máy phim thật.',
              attachment: _negativeProof,
              isRequired: false,
              errorMessage: _negativeProofError,
              icon: Icons.motion_photos_on_outlined,
              onPickRequested: _pickNegativeProof,
              onRemove: () {
                setState(() {
                  _negativeProof = null;
                  _negativeProofError = null;
                });
              },
              onPreview: _negativeProof != null
                  ? () => _previewImage(
                        _negativeProof!,
                        'Xem trước ảnh âm bản / Contact sheet',
                      )
                  : null,
            ),
            const SizedBox(height: 24),

            // Section 4: Shooting & Dev Scan Parameters
            Text(
              '4. Thông số kỹ thuật chụp & tráng scan',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              elevation: 0,
              color: colorScheme.surfaceContainerLow,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: colorScheme.outlineVariant),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const CircleAvatar(
                        child: Icon(Icons.camera_alt_outlined),
                      ),
                      title: const Text('Thông số chụp (FPC-43)'),
                      subtitle: Text(
                        _shootingParams != null
                            ? '${_shootingParams!.cameraBody} • ${_shootingParams!.filmBrand} ${_shootingParams!.filmStock} (ISO ${_shootingParams!.isoRated})'
                            : 'Chưa nhập thông số chụp',
                      ),
                      trailing: const Icon(Icons.edit_outlined),
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (context) => FilmParamsScreen(
                              initialParams: _shootingParams,
                              onSaved: (params) {
                                setState(() => _shootingParams = params);
                              },
                            ),
                          ),
                        );
                      },
                    ),
                    const Divider(),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const CircleAvatar(
                        child: Icon(Icons.scanner_outlined),
                      ),
                      title: const Text('Thông số tráng scan (FPC-44)'),
                      subtitle: Text(
                        _devScanParams != null
                            ? '${_devScanParams!.labName} • ${_devScanParams!.scannerModel}'
                            : 'Chưa nhập thông số tráng scan',
                      ),
                      trailing: const Icon(Icons.edit_outlined),
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (context) => FilmDevScanScreen(
                              initialParams: _devScanParams,
                              onSaved: (params) {
                                setState(() => _devScanParams = params);
                              },
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Action Buttons
            CustomButton(
              label: 'Nộp bài thi',
              icon: const Icon(Icons.cloud_upload_outlined),
              isLoading: _isSubmitting,
              onPressed: _submitForm,
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _isSubmitting ? null : _resetForm,
              child: const Text('Đặt lại form'),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
