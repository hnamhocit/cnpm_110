import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../models/image_attachment.dart';

class ImagePickerCard extends StatelessWidget {
  const ImagePickerCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.helperText,
    this.attachment,
    this.isRequired = false,
    this.errorMessage,
    required this.onPickRequested,
    this.onRemove,
    this.onPreview,
    this.icon = Icons.add_photo_alternate_outlined,
  });

  final String title;
  final String subtitle;
  final String? helperText;
  final ImageAttachment? attachment;
  final bool isRequired;
  final String? errorMessage;
  final Future<void> Function(ImageSource source) onPickRequested;
  final VoidCallback? onRemove;
  final VoidCallback? onPreview;
  final IconData icon;

  void _showSourceSelector(BuildContext context) {
    final theme = Theme.of(context);

    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Chọn ảnh cho: $title',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const CircleAvatar(
                    child: Icon(Icons.photo_library_outlined),
                  ),
                  title: const Text('Thư viện ảnh'),
                  subtitle: const Text('Chọn ảnh có sẵn từ bộ nhớ thiết bị'),
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    onPickRequested(ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    child: Icon(Icons.camera_alt_outlined),
                  ),
                  title: const Text('Chụp ảnh mới'),
                  subtitle: const Text('Mở camera để chụp trực tiếp'),
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    onPickRequested(ImageSource.camera);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildThumbnail(BuildContext context) {
    if (attachment == null) return const SizedBox.shrink();

    if (attachment!.bytes != null) {
      return Image.memory(
        attachment!.bytes!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => const Center(
          child: Icon(Icons.broken_image_outlined, size: 36, color: Colors.grey),
        ),
      );
    }

    if (!kIsWeb && attachment!.file.path.isNotEmpty) {
      return Image.file(
        File(attachment!.file.path),
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => const Center(
          child: Icon(Icons.broken_image_outlined, size: 36, color: Colors.grey),
        ),
      );
    }

    return Image.network(
      attachment!.file.path,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => const Center(
        child: Icon(Icons.broken_image_outlined, size: 36, color: Colors.grey),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasError = errorMessage != null && errorMessage!.isNotEmpty;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: hasError
              ? colorScheme.error
              : (attachment != null
                  ? colorScheme.primary.withValues(alpha: 0.6)
                  : colorScheme.outlineVariant),
          width: hasError || attachment != null ? 1.5 : 1.0,
        ),
      ),
      color: hasError
          ? colorScheme.errorContainer.withValues(alpha: 0.08)
          : colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card Title & Requirement Badge
            Row(
              children: [
                Icon(icon, color: colorScheme.primary, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isRequired
                        ? colorScheme.primaryContainer
                        : colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isRequired ? 'Bắt buộc' : 'Tùy chọn',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: isRequired
                          ? colorScheme.onPrimaryContainer
                          : colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (helperText != null) ...[
              const SizedBox(height: 6),
              Text(
                helperText!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.8),
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
            const SizedBox(height: 16),

            // Content Area: Empty state or Attached image preview
            if (attachment == null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: colorScheme.outlineVariant,
                    style: BorderStyle.solid,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.cloud_upload_outlined,
                      size: 40,
                      color: colorScheme.primary.withValues(alpha: 0.8),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chưa có ảnh được chọn',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Hỗ trợ JPG, PNG, WebP',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        FilledButton.tonalIcon(
                          onPressed: () => onPickRequested(ImageSource.gallery),
                          icon: const Icon(Icons.photo_library_outlined, size: 18),
                          label: const Text('Thư viện ảnh'),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => onPickRequested(ImageSource.camera),
                          icon: const Icon(Icons.camera_alt_outlined, size: 18),
                          label: const Text('Máy ảnh'),
                        ),
                      ],
                    ),
                  ],
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: colorScheme.outlineVariant),
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Thumbnail Preview with Click-to-preview
                        GestureDetector(
                          onTap: onPreview,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Stack(
                              children: [
                                SizedBox(
                                  width: 88,
                                  height: 88,
                                  child: _buildThumbnail(context),
                                ),
                                Positioned(
                                  bottom: 4,
                                  right: 4,
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.6),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Icon(
                                      Icons.fullscreen,
                                      size: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Metadata details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                attachment!.name,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(
                                    Icons.insert_drive_file_outlined,
                                    size: 14,
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    attachment!.formattedSize,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: colorScheme.onSurfaceVariant,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(
                                    Icons.check_circle_outline,
                                    size: 14,
                                    color: colorScheme.primary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Đã tải và sẵn sàng nộp',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: colorScheme.primary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1),
                    const SizedBox(height: 8),
                    // Action Buttons Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          onPressed: onPreview,
                          icon: const Icon(Icons.visibility_outlined, size: 16),
                          label: const Text('Xem lớn'),
                        ),
                        const SizedBox(width: 4),
                        TextButton.icon(
                          onPressed: () => _showSourceSelector(context),
                          icon: const Icon(Icons.cached_outlined, size: 16),
                          label: const Text('Đổi ảnh'),
                        ),
                        const SizedBox(width: 4),
                        TextButton.icon(
                          onPressed: onRemove,
                          icon: Icon(
                            Icons.delete_outline,
                            size: 16,
                            color: colorScheme.error,
                          ),
                          label: Text(
                            'Xóa',
                            style: TextStyle(color: colorScheme.error),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

            // Validation Error text
            if (hasError) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.error_outline, size: 16, color: colorScheme.error),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      errorMessage!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
