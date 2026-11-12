import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/components/loading_dialog.dart';
import '../../core/data/submission_repository.dart';
import '../../core/network/api_exception.dart';
import '../../core/providers/my_submissions_provider.dart';
import '../../core/services/image_compression_service.dart';
import '../../core/services/image_picker_service.dart';
import '../../models/image_attachment.dart';
import '../../models/user_submission.dart';
import 'components/image_preview_dialog.dart';
import 'components/live_countdown_widget.dart';
import 'components/moderation_timeline_widget.dart';
import 'components/rejection_details_sheet.dart';

class MySubmissionsScreen extends ConsumerStatefulWidget {
  const MySubmissionsScreen({super.key});

  @override
  ConsumerState<MySubmissionsScreen> createState() => _MySubmissionsScreenState();
}

class _MySubmissionsScreenState extends ConsumerState<MySubmissionsScreen> {
  final _searchController = TextEditingController();
  Timer? _pollingTimer;
  Map<String, SubmissionStatus> _previousStatuses = {};

  @override
  void initState() {
    super.initState();
    _startRealtimePolling();
  }

  void _startRealtimePolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) => _pollSubmissions());
  }

  Future<void> _pollSubmissions() async {
    if (!mounted) return;

    final current = ref.read(mySubmissionsProvider).value;
    if (current != null && _previousStatuses.isEmpty) {
      _previousStatuses = {for (final s in current) s.id: s.status};
    }

    final updated = await ref.read(mySubmissionsProvider.notifier).silentRefresh();
    if (!mounted || updated == null) return;

    if (_previousStatuses.isNotEmpty) {
      for (final sub in updated) {
        final oldStatus = _previousStatuses[sub.id];
        if (oldStatus != null && oldStatus != sub.status) {
          _notifyStatusChange(sub, oldStatus);
        }
      }
    }

    _previousStatuses = {for (final s in updated) s.id: s.status};
  }

  void _notifyStatusChange(UserSubmission sub, SubmissionStatus oldStatus) {
    if (!mounted) return;
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final theme = Theme.of(context);

    if (sub.status == SubmissionStatus.approved) {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Bài thi "${sub.title}" đã được duyệt Hợp lệ!'),
              ),
            ],
          ),
          backgroundColor: Colors.green.shade800,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
        ),
      );
    } else if (sub.status == SubmissionStatus.proofRequested) {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Bài thi "${sub.title}" yêu cầu nộp ảnh âm bản (BR-19)!'),
              ),
            ],
          ),
          backgroundColor: Colors.amber.shade900,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Nộp ngay',
            textColor: Colors.white,
            onPressed: () => _showProofUploadModal(context, sub),
          ),
          duration: const Duration(seconds: 6),
        ),
      );
    } else if (sub.status == SubmissionStatus.disqualified ||
        sub.status == SubmissionStatus.disqualifiedNoProof) {
      final reason = sub.rejectionReason != null && sub.rejectionReason!.isNotEmpty
          ? ': ${sub.rejectionReason}'
          : '';
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.cancel_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Bài thi "${sub.title}" bị từ chối$reason'),
              ),
            ],
          ),
          backgroundColor: theme.colorScheme.error,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Xem lý do',
            textColor: Colors.white,
            onPressed: () => RejectionDetailsSheet.show(context, submission: sub),
          ),
          duration: const Duration(seconds: 6),
        ),
      );
    } else {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('Bài thi "${sub.title}": chuyển sang trạng thái "${sub.status.label}"'),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    ref.read(mySubmissionsSearchProvider.notifier).setQuery(value);
  }

  void _showProofUploadModal(BuildContext context, UserSubmission submission) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 20,
              top: 20,
              left: 20,
              right: 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Icon(Icons.report_problem_rounded, color: colorScheme.error),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Bổ sung dải âm bản đối chứng (BR-19)',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.errorContainer.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: colorScheme.error.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bài thi: ${submission.title} (${submission.displayCode})',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (submission.proofDeadlineAt != null) ...[
                        const SizedBox(height: 6),
                        LiveCountdownWidget(
                          deadlineAt: submission.proofDeadlineAt!,
                          prefixText: 'Thời hạn còn lại: ',
                          textStyle: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.error,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ] else if (submission.remainingProofText != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          submission.remainingProofText!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.error,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        'Theo quy tắc BR-19, thí sinh có 48 giờ để cung cấp ảnh chụp dải phim âm bản gốc có viền mã vạch và số khung hình. Quá thời hạn này bài thi sẽ tự động bị loại.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(sheetContext).pop();
                          _handleProofUpload(context, submission, ImageSource.camera);
                        },
                        icon: const Icon(Icons.camera_alt_rounded),
                        label: const Text('Chụp ảnh'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () {
                          Navigator.of(sheetContext).pop();
                          _handleProofUpload(context, submission, ImageSource.gallery);
                        },
                        icon: const Icon(Icons.photo_library_rounded),
                        label: const Text('Thư viện'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => Navigator.of(sheetContext).pop(),
                  child: const Text('Đóng'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _handleProofUpload(
    BuildContext context,
    UserSubmission submission,
    ImageSource source,
  ) async {
    try {
      final picker = ref.read(imagePickerServiceProvider);
      final rawAttachment = await picker.pickAttachment(source: source);
      if (rawAttachment == null || !mounted) return;

      LoadingDialog.show(context, message: 'Đang xử lý và tải ảnh âm bản...');

      final compressor = ref.read(imageCompressionServiceProvider);
      final compResult = await compressor.compressAttachment(
        rawAttachment,
        config: const ImageCompressionConfig(
          requireMinShortEdge: false,
          targetMaxBytes: 20 * 1024 * 1024,
        ),
      );

      final repo = ref.read(submissionRepositoryProvider);
      await repo.uploadNegativeProof(
        submissionId: submission.id,
        proofImage: compResult.attachment,
      );

      if (!mounted) return;
      LoadingDialog.hide(context);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Đã nộp ảnh dải âm bản thành công! Đang chờ Ban tổ chức đối chiếu.',
          ),
          backgroundColor: Colors.green,
        ),
      );

      await ref.read(mySubmissionsProvider.notifier).refresh();
    } catch (e) {
      if (!mounted) return;
      try {
        LoadingDialog.hide(context);
      } catch (_) {}

      final message =
          e is ApiException ? e.message : 'Không thể tải ảnh âm bản: $e';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  void _showSubmissionDetailsSheet(BuildContext context, UserSubmission submission) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final meta = submission.filmMetadata;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          expand: false,
          builder: (context, scrollController) {
            return ListView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            submission.title,
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Mã: ${submission.displayCode}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _StatusBadge(status: submission.status),
                  ],
                ),
                const SizedBox(height: 16),
                // Thumbnail preview
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 16 / 10,
                    child: _buildImageWidget(submission.bestDisplayImagePath),
                  ),
                ),
                const SizedBox(height: 16),

                // Real-time Moderation Timeline (FPC-63)
                Card(
                  elevation: 0,
                  color: colorScheme.surfaceContainerLow,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: colorScheme.outlineVariant),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: ModerationTimelineWidget(submission: submission),
                  ),
                ),
                const SizedBox(height: 16),

                // Rejection Reason Alert & Detailed Guidance (FPC-64)
                if (submission.status == SubmissionStatus.disqualified ||
                    submission.status == SubmissionStatus.disqualifiedNoProof) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colorScheme.error.withValues(alpha: 0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.info_outline, color: colorScheme.error, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Lý do bị từ chối (BR-18):',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: colorScheme.error,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    (submission.rejectionReason != null &&
                                            submission.rejectionReason!.isNotEmpty)
                                        ? submission.rejectionReason!
                                        : (submission.status ==
                                                SubmissionStatus.disqualifiedNoProof
                                            ? 'Quá thời hạn 48 giờ nộp dải phim âm bản đối chứng (BR-19).'
                                            : 'Không đáp ứng điều lệ cuộc thi.'),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: colorScheme.onErrorContainer,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        FilledButton.tonalIcon(
                          key: const Key('details_view_rejection_guidance_button'),
                          onPressed: () => RejectionDetailsSheet.show(
                            context,
                            submission: submission,
                          ),
                          style: FilledButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            backgroundColor: colorScheme.errorContainer,
                            foregroundColor: colorScheme.error,
                          ),
                          icon: const Icon(Icons.help_outline_rounded, size: 16),
                          label: const Text('Xem chi tiết lý do & Hướng dẫn bổ sung'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Action if proof requested
                if (submission.status == SubmissionStatus.proofRequested) ...[
                  FilledButton.icon(
                    onPressed: () {
                      Navigator.of(sheetContext).pop();
                      _showProofUploadModal(context, submission);
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: colorScheme.error,
                      foregroundColor: colorScheme.onError,
                    ),
                    icon: const Icon(Icons.upload_file_rounded),
                    label: const Text('Bổ sung ảnh âm bản ngay'),
                  ),
                  const SizedBox(height: 16),
                ],

                // Technical Info Card
                Text(
                  'Thông số tệp ảnh (BR-07)',
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 0,
                  color: colorScheme.surfaceContainerLow,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        _infoRow('Độ phân giải', submission.formattedResolution),
                        _infoRow('Dung lượng', submission.formattedFileSize),
                        _infoRow('Cảnh báo AI', submission.aiFlagged ? 'Có cảnh báo' : 'Bình thường'),
                        _infoRow('Bằng chứng âm bản', submission.hasProofAttached ? 'Đã đính kèm' : 'Chưa có'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Film Metadata (BR-22)
                Text(
                  'Siêu dữ liệu Analog (BR-22)',
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 0,
                  color: colorScheme.surfaceContainerLow,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        _infoRow('Hãng & Loại phim', meta?.filmStock ?? 'Chưa rõ'),
                        _infoRow('Khổ phim', meta?.filmFormat ?? '135 (35mm)'),
                        _infoRow('ISO', 'ISO ${meta?.isoShot ?? meta?.isoRated ?? 400}'),
                        _infoRow('Thân máy', meta?.cameraBody ?? 'Chưa rõ'),
                        if (meta?.lens != null && meta!.lens!.isNotEmpty)
                          _infoRow('Ống kính', meta.lens!),
                        if (meta?.frameNumber != null && meta!.frameNumber!.isNotEmpty)
                          _infoRow('Khung hình số', meta.frameNumber!),
                        if (meta?.devLabName != null && meta!.devLabName!.isNotEmpty)
                          _infoRow('Phòng Lab', meta.devLabName!),
                        if (meta?.devChemistry != null && meta!.devChemistry!.isNotEmpty)
                          _infoRow('Hóa chất tráng', meta.devChemistry!),
                        if (meta?.scannerModel != null && meta!.scannerModel!.isNotEmpty)
                          _infoRow('Máy scan', meta.scannerModel!),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                OutlinedButton(
                  onPressed: () => Navigator.of(sheetContext).pop(),
                  child: const Text('Đóng'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  void _previewImage(BuildContext context, UserSubmission submission) {
    final imagePath = submission.bestDisplayImagePath;
    if (imagePath.isEmpty) return;
    final isRemote = imagePath.startsWith('http://') || imagePath.startsWith('https://');

    ImageAttachment attachment;
    if (isRemote) {
      attachment = ImageAttachment(
        file: XFile(imagePath),
        name: '${submission.title}.jpg',
        sizeInBytes: submission.fileSizeBytes ?? 0,
        mimeType: 'image/jpeg',
      );
    } else {
      attachment = ImageAttachment(
        file: XFile(imagePath),
        name: '${submission.title}.jpg',
        sizeInBytes: submission.fileSizeBytes ?? 0,
      );
    }

    ImagePreviewDialog.show(
      context,
      attachment: attachment,
      title: submission.title,
    );
  }

  Widget _buildImageWidget(String path) {
    if (path.isEmpty) {
      return Container(
        color: Colors.grey.shade200,
        child: const Center(
          child: Icon(Icons.image_not_supported_outlined, size: 36, color: Colors.grey),
        ),
      );
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Image.network(
        path,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(
          color: Colors.grey.shade200,
          child: const Center(
            child: Icon(Icons.broken_image_outlined, size: 36, color: Colors.grey),
          ),
        ),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: Colors.grey.shade100,
            child: const Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          );
        },
      );
    }

    if (!kIsWeb) {
      final file = File(path);
      if (file.existsSync()) {
        return Image.file(
          file,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => Container(
            color: Colors.grey.shade200,
            child: const Center(
              child: Icon(Icons.broken_image_outlined, size: 36, color: Colors.grey),
            ),
          ),
        );
      }
    }

    return Container(
      color: Colors.grey.shade200,
      child: const Center(
        child: Icon(Icons.photo_outlined, size: 36, color: Colors.grey),
      ),
    );
  }

  Widget _buildErrorView(BuildContext context, Object error) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final message = error is ApiException
        ? error.message
        : 'Không thể tải danh sách bài thi: $error';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: colorScheme.error),
            const SizedBox(height: 12),
            Text(
              'Đã xảy ra lỗi',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () =>
                  ref.read(mySubmissionsProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final submissionsAsync = ref.watch(mySubmissionsProvider);
    final filteredSubmissions = ref.watch(filteredSubmissionsProvider);
    final selectedFilter = ref.watch(mySubmissionsFilterProvider);
    final urgentCount = ref.watch(proofRequestedCountProvider);

    final urgentWithDeadline = (submissionsAsync.value ?? const [])
        .where((s) => s.status == SubmissionStatus.proofRequested && s.proofDeadlineAt != null)
        .toList()
      ..sort((a, b) => a.proofDeadlineAt!.compareTo(b.proofDeadlineAt!));
    final earliestDeadline = urgentWithDeadline.isNotEmpty
        ? urgentWithDeadline.first.proofDeadlineAt
        : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bài thi của tôi'),
        centerTitle: false,
        actions: [
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.green.shade300),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Colors.green.shade600,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Trực tiếp',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.green.shade800,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Làm mới',
            onPressed: () => ref.read(mySubmissionsProvider.notifier).refresh(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Urgent Alert Banner if any proof is requested (BR-19)
          if (urgentCount > 0)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: colorScheme.errorContainer.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: colorScheme.error.withValues(alpha: 0.5)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: colorScheme.error, size: 24),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Cần bổ sung âm bản khẩn cấp (BR-19)',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.error,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Bạn có $urgentCount bài thi cần tải dải âm bản trong 48 giờ.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onErrorContainer,
                            fontSize: 12,
                          ),
                        ),
                        if (earliestDeadline != null) ...[
                          const SizedBox(height: 4),
                          LiveCountdownWidget(
                            deadlineAt: earliestDeadline,
                            prefixText: 'Hạn chót gần nhất: ',
                            textStyle: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.error,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      ref.read(mySubmissionsFilterProvider.notifier).select(
                            SubmissionFilter.proofRequested,
                          );
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: colorScheme.error,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                    child: const Text('Xem ngay'),
                  ),
                ],
              ),
            ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Tìm theo tên bài thi, mã bài nộp...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colorScheme.outlineVariant),
                ),
                filled: true,
                fillColor: colorScheme.surfaceContainerLowest,
              ),
            ),
          ),

          // Filter Chips Row
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: SubmissionFilter.values.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final filter = SubmissionFilter.values[index];
                final isSelected = filter == selectedFilter;

                String label = filter.label;
                if (filter == SubmissionFilter.proofRequested && urgentCount > 0) {
                  label = '$label ($urgentCount)';
                }

                return ChoiceChip(
                  label: Text(label),
                  selected: isSelected,
                  selectedColor: filter == SubmissionFilter.proofRequested && urgentCount > 0
                      ? colorScheme.errorContainer
                      : null,
                  labelStyle: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: filter == SubmissionFilter.proofRequested && urgentCount > 0 && isSelected
                        ? colorScheme.error
                        : null,
                  ),
                  onSelected: (_) {
                    ref.read(mySubmissionsFilterProvider.notifier).select(filter);
                  },
                );
              },
            ),
          ),

          const Divider(height: 1),

          // Submissions List Body
          Expanded(
            child: (submissionsAsync.hasError && !submissionsAsync.hasValue)
                ? _buildErrorView(context, submissionsAsync.error!)
                : submissionsAsync.when(
                    loading: () => const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text('Đang tải danh sách bài thi...'),
                        ],
                      ),
                    ),
                    error: (error, stack) => _buildErrorView(context, error),
                    data: (_) {
                if (filteredSubmissions.isEmpty) {
                  final isFiltered = selectedFilter != SubmissionFilter.all ||
                      _searchController.text.isNotEmpty;

                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isFiltered
                                ? Icons.filter_list_off_rounded
                                : Icons.photo_library_outlined,
                            size: 64,
                            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            isFiltered
                                ? 'Không tìm thấy bài thi phù hợp'
                                : 'Bạn chưa có bài dự thi nào',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            isFiltered
                                ? 'Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.'
                                : 'Hãy khám phá các cuộc thi ảnh phim đang mở để gửi tác phẩm của bạn!',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 20),
                          if (isFiltered)
                            OutlinedButton.icon(
                              onPressed: () {
                                _searchController.clear();
                                ref
                                    .read(mySubmissionsSearchProvider.notifier)
                                    .setQuery('');
                                ref
                                    .read(mySubmissionsFilterProvider.notifier)
                                    .select(SubmissionFilter.all);
                              },
                              icon: const Icon(Icons.clear_all),
                              label: const Text('Xóa bộ lọc'),
                            )
                          else
                            FilledButton.icon(
                              onPressed: () => context.go('/'),
                              icon: const Icon(Icons.explore_outlined),
                              label: const Text('Khám phá cuộc thi'),
                            ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.read(mySubmissionsProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: filteredSubmissions.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final submission = filteredSubmissions[index];
                      return _SubmissionCard(
                        submission: submission,
                        onTap: () => _showSubmissionDetailsSheet(context, submission),
                        onPreviewImage: () => _previewImage(context, submission),
                        onUploadProof: () => _showProofUploadModal(context, submission),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final SubmissionStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final badgeColor = status.getBadgeColor(colorScheme);
    final bgColor = status.getBadgeBackgroundColor(colorScheme);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(status.icon, size: 14, color: badgeColor),
          const SizedBox(width: 4),
          Text(
            status.label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: badgeColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _SubmissionCard extends StatelessWidget {
  const _SubmissionCard({
    required this.submission,
    required this.onTap,
    required this.onPreviewImage,
    required this.onUploadProof,
  });

  final UserSubmission submission;
  final VoidCallback onTap;
  final VoidCallback onPreviewImage;
  final VoidCallback onUploadProof;

  Widget _buildThumbnail(BuildContext context) {
    final path = submission.bestDisplayImagePath;

    if (path.isEmpty) {
      return Container(
        width: 84,
        height: 84,
        color: Colors.grey.shade200,
        child: const Center(
          child: Icon(Icons.image_not_supported_outlined, size: 28, color: Colors.grey),
        ),
      );
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Image.network(
        path,
        width: 84,
        height: 84,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(
          width: 84,
          height: 84,
          color: Colors.grey.shade200,
          child: const Center(
            child: Icon(Icons.broken_image_outlined, size: 28, color: Colors.grey),
          ),
        ),
      );
    }

    if (!kIsWeb) {
      final file = File(path);
      if (file.existsSync()) {
        return Image.file(
          file,
          width: 84,
          height: 84,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => Container(
            width: 84,
            height: 84,
            color: Colors.grey.shade200,
            child: const Center(
              child: Icon(Icons.broken_image_outlined, size: 28, color: Colors.grey),
            ),
          ),
        );
      }
    }

    return Container(
      width: 84,
      height: 84,
      color: Colors.grey.shade200,
      child: const Center(
        child: Icon(Icons.photo_outlined, size: 28, color: Colors.grey),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isUrgent = submission.status == SubmissionStatus.proofRequested;

    return Card(
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isUrgent
              ? colorScheme.error.withValues(alpha: 0.6)
              : colorScheme.outlineVariant,
          width: isUrgent ? 1.5 : 1.0,
        ),
      ),
      color: isUrgent
          ? colorScheme.errorContainer.withValues(alpha: 0.05)
          : colorScheme.surface,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Clickable Thumbnail Preview
                  GestureDetector(
                    onTap: submission.bestDisplayImagePath.isNotEmpty
                        ? onPreviewImage
                        : null,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Stack(
                        children: [
                          _buildThumbnail(context),
                          if (submission.bestDisplayImagePath.isNotEmpty)
                            Positioned(
                              bottom: 4,
                              right: 4,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.6),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Icon(
                                  Icons.fullscreen,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                submission.title,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            _StatusBadge(status: submission.status),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          submission.displayCode,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (submission.filmMetadata != null) ...[
                          Text(
                            submission.filmMetadata!.summary,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                        ],
                        if (submission.contestTitle != null)
                          Text(
                            submission.contestTitle!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.8),
                              fontStyle: FontStyle.italic,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),

              // Urgent Action Bar if Proof is Requested (BR-19)
              if (isUrgent) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: colorScheme.errorContainer.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: colorScheme.error.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.timer_outlined, size: 16, color: colorScheme.error),
                      const SizedBox(width: 6),
                      Expanded(
                        child: submission.proofDeadlineAt != null
                            ? LiveCountdownWidget(
                                deadlineAt: submission.proofDeadlineAt!,
                                prefixText: 'Hạn nộp: ',
                                textStyle: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              )
                            : Text(
                                submission.remainingProofText ?? 'Yêu cầu nộp dải âm bản trong 48h (BR-19)',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colorScheme.error,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                      ),
                      FilledButton.tonal(
                        onPressed: onUploadProof,
                        style: FilledButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                          backgroundColor: colorScheme.error,
                          foregroundColor: colorScheme.onError,
                        ),
                        child: const Text('Nộp âm bản'),
                      ),
                    ],
                  ),
                ),
              ],

              // Disqualification Rejection Reason Bar with Detailed Guidance button (FPC-64)
              if (submission.status == SubmissionStatus.disqualified ||
                  submission.status == SubmissionStatus.disqualifiedNoProof) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: colorScheme.errorContainer.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: colorScheme.error.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline, size: 16, color: colorScheme.error),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              (submission.rejectionReason != null &&
                                      submission.rejectionReason!.isNotEmpty)
                                  ? 'Lý do: ${submission.rejectionReason}'
                                  : (submission.status ==
                                          SubmissionStatus.disqualifiedNoProof
                                      ? 'Lý do: Quá hạn 48 giờ nộp dải âm bản (BR-19)'
                                      : 'Lý do: Không đáp ứng thể lệ cuộc thi'),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.error,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton.icon(
                          key: Key('card_rejection_guidance_${submission.id}'),
                          onPressed: () => RejectionDetailsSheet.show(
                            context,
                            submission: submission,
                          ),
                          style: OutlinedButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            foregroundColor: colorScheme.error,
                            side: BorderSide(color: colorScheme.error.withValues(alpha: 0.5)),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          ),
                          icon: const Icon(Icons.help_outline_rounded, size: 14),
                          label: const Text(
                            'Xem lý do & Hướng dẫn',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
