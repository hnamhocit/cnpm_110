import 'package:flutter/material.dart';

import '../../../models/user_submission.dart';

/// Danh mục quy chế áp dụng khi bài thi bị từ chối
class ViolatedRuleInfo {
  const ViolatedRuleInfo({
    required this.ruleCode,
    required this.title,
    required this.description,
    required this.icon,
  });

  final String ruleCode;
  final String title;
  final String description;
  final IconData icon;
}

/// Màn hình / BottomSheet thông báo chi tiết lý do bài thi bị từ chối
/// kèm hướng dẫn bổ sung thông tin cho thí sinh (Jira FPC-64).
class RejectionDetailsSheet extends StatelessWidget {
  const RejectionDetailsSheet({
    super.key,
    required this.submission,
    this.onAppealSubmitted,
  });

  final UserSubmission submission;
  final void Function(String category, String content)? onAppealSubmitted;

  /// Hiển thị RejectionDetailsSheet dạng Modal Bottom Sheet
  static Future<void> show(
    BuildContext context, {
    required UserSubmission submission,
    void Function(String category, String content)? onAppealSubmitted,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => RejectionDetailsSheet(
        submission: submission,
        onAppealSubmitted: onAppealSubmitted,
      ),
    );
  }

  static String _formatDateTime(DateTime? dt) {
    if (dt == null) return 'Chưa ghi nhận thời điểm';
    final d = dt.toLocal();
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final year = d.year;
    final hour = d.hour.toString().padLeft(2, '0');
    final minute = d.minute.toString().padLeft(2, '0');
    return '$hour:$minute, $day/$month/$year';
  }

  /// Tự động phân tích lý do và quy chế áp dụng dựa theo trạng thái và nội dung từ chối
  List<ViolatedRuleInfo> _detectViolatedRules() {
    final rules = <ViolatedRuleInfo>[];
    final reasonLower = (submission.rejectionReason ?? '').toLowerCase();
    final isNoProof = submission.status == SubmissionStatus.disqualifiedNoProof;

    // BR-19: Quá hạn 48 giờ nộp âm bản
    if (isNoProof ||
        reasonLower.contains('48') ||
        reasonLower.contains('quá hạn') ||
        reasonLower.contains('hạn chót') ||
        reasonLower.contains('deadline')) {
      rules.add(
        const ViolatedRuleInfo(
          ruleCode: 'BR-19',
          title: 'Quy định BR-19: Hạn chót 48 giờ đối chứng âm bản',
          description:
              'Khi Ban tổ chức yêu cầu đối chứng, thí sinh có chính xác 48 giờ để tải lên ảnh dải phim âm bản gốc. Quá thời hạn này bài thi sẽ tự động bị loại khỏi hệ thống.',
          icon: Icons.timer_off_rounded,
        ),
      );
    }

    // BR-06: Xác thực âm bản gốc (mã vạch rebate edge, số frame)
    if (reasonLower.contains('âm bản') ||
        reasonLower.contains('negative') ||
        reasonLower.contains('rebate') ||
        reasonLower.contains('mã vạch') ||
        reasonLower.contains('contact sheet')) {
      rules.add(
        const ViolatedRuleInfo(
          ruleCode: 'BR-06',
          title: 'Quy định BR-06: Bằng chứng dải phim âm bản gốc',
          description:
              'Ảnh âm bản đối chứng bắt buộc phải nhìn rõ viền rebate edge chứa tên hãng sản xuất loại phim và số thứ tự khung hình khớp với tác phẩm đã nộp.',
          icon: Icons.filter_rounded,
        ),
      );
    }

    // BR-07: Chuẩn kỹ thuật tệp ảnh số hóa
    if (reasonLower.contains('phân giải') ||
        reasonLower.contains('2000px') ||
        reasonLower.contains('dung lượng') ||
        reasonLower.contains('25mb') ||
        reasonLower.contains('mờ') ||
        reasonLower.contains('hạt phim') ||
        reasonLower.contains('grain')) {
      rules.add(
        const ViolatedRuleInfo(
          ruleCode: 'BR-07',
          title: 'Quy định BR-07: Tiêu chuẩn tệp ảnh scan số hóa',
          description:
              'Tệp ảnh scan dự thi phải có cạnh ngắn tối thiểu 2000px, dung lượng tối đa 25MB, định dạng JPG/TIFF và bảo toàn cấu trúc hạt phim tự nhiên.',
          icon: Icons.photo_size_select_actual_outlined,
        ),
      );
    }

    // BR-09 / BR-10: Cảnh báo AI hoặc trùng lặp
    if (submission.aiFlagged ||
        reasonLower.contains('ai') ||
        reasonLower.contains('trùng') ||
        reasonLower.contains('duplicate') ||
        reasonLower.contains('phash')) {
      rules.add(
        const ViolatedRuleInfo(
          ruleCode: 'BR-09 / BR-10',
          title: 'Quy định BR-09 & BR-10: Cảnh báo AI & Phát hiện trùng lặp',
          description:
              'Hệ thống AI phát hiện xác suất ảnh tạo sinh (P_AI >= 75%) hoặc khoảng cách Hamming pHash tương đồng <= 5 với tác phẩm khác.',
          icon: Icons.auto_awesome_outlined,
        ),
      );
    }

    // BR-04 / BR-22 / BR-23: Siêu dữ liệu vật lý
    if (reasonLower.contains('khung hình') ||
        reasonLower.contains('frame') ||
        reasonLower.contains('thông số') ||
        reasonLower.contains('máy ảnh') ||
        reasonLower.contains('lab')) {
      rules.add(
        const ViolatedRuleInfo(
          ruleCode: 'BR-22 / BR-23',
          title: 'Quy định BR-22 & BR-23: Siêu dữ liệu vật lý nhiếp ảnh phim',
          description:
              'Bài thi phải khai báo đủ 5 thông số vật lý (Loại phim, Khổ phim, Máy ảnh, Khung hình, Lab tráng) và không vượt giới hạn vật lý của khổ phim.',
          icon: Icons.camera_roll_outlined,
        ),
      );
    }

    // Mặc định quy định chung BR-18 nếu chưa có quy tắc nào khớp
    if (rules.isEmpty) {
      rules.add(
        const ViolatedRuleInfo(
          ruleCode: 'BR-18',
          title: 'Quy tắc BR-18: Kiểm duyệt & Thẩm định Ban tổ chức',
          description:
              'Quyết định từ chối bài thi được ghi vết kiểm toán (Audit Log) theo thẩm quyền thẩm định chuyên môn của Ban tổ chức cuộc thi.',
          icon: Icons.gavel_rounded,
        ),
      );
    }

    return rules;
  }

  void _openAppealDialog(BuildContext context) {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    showDialog<void>(
      context: context,
      builder: (dialogContext) => _AppealFormDialog(
        submission: submission,
        onSubmit: (category, content) {
          if (onAppealSubmitted != null) {
            onAppealSubmitted!(category, content);
          }
          scaffoldMessenger.showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Đã gửi giải trình cho bài thi "${submission.title}" (${submission.displayCode}) tới Ban tổ chức.',
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.green.shade800,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 5),
            ),
          );
        },
      ),
    );
  }

  void _openProofGuideDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => const _NegativeProofGuideDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final violatedRules = _detectViolatedRules();

    final officialReason = (submission.rejectionReason != null &&
            submission.rejectionReason!.trim().isNotEmpty)
        ? submission.rejectionReason!.trim()
        : (submission.status == SubmissionStatus.disqualifiedNoProof
            ? 'Bài thi tự động bị loại do quá thời hạn 48 giờ nộp ảnh chụp dải phim âm bản đối chứng (Quy định BR-19). Không ghi nhận được bằng chứng âm bản hợp lệ từ thí sinh.'
            : 'Tác phẩm không đáp ứng điều lệ và tiêu chuẩn kỹ thuật của cuộc thi nhiếp ảnh phim (Quy tắc BR-18).');

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              // Thanh kéo drag handle
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header tiêu đề & mã bài thi
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.cancel_rounded,
                      color: colorScheme.error,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Chi tiết lý do từ chối bài thi',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: colorScheme.error,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          submission.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'Mã: ${submission.displayCode} • ${submission.contestTitle ?? 'Cuộc thi phim'}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    tooltip: 'Đóng',
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // 1. Khung hiển thị lý do chính thức từ BTC
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: colorScheme.error.withValues(alpha: 0.5),
                    width: 1.2,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.gavel_rounded, size: 18, color: colorScheme.error),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Lý do chính thức từ Ban tổ chức (BR-18)',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: colorScheme.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      officialReason,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onErrorContainer,
                        height: 1.4,
                      ),
                    ),
                    if (submission.updatedAt != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        'Thời điểm kiểm duyệt: ${_formatDateTime(submission.updatedAt)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 2. Phân tích vi phạm & Quy chế áp dụng
              Text(
                'Quy chế & Điều lệ liên quan',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ...violatedRules.map(
                (rule) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colorScheme.outlineVariant),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(rule.icon, size: 20, color: colorScheme.primary),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                rule.title,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                rule.description,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 3. Hướng dẫn bổ sung thông tin & Biện pháp khắc phục
              Text(
                'Hướng dẫn khắc phục & Bổ sung thông tin',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),

              // Bước 1
              _buildStepCard(
                context,
                stepNumber: '1',
                title: 'Kiểm tra dải phim âm bản & Sổ tay cuộn phim',
                description:
                    'Tìm lại dải phim âm bản chứa khung hình đã nộp. Đối chiếu thông số loại phim, số frame và phòng Lab trong Sổ tay cuộn phim (Film Logbook) để xác minh độ chính xác.',
                icon: Icons.inventory_2_outlined,
              ),
              const SizedBox(height: 8),

              // Bước 2
              _buildStepCard(
                context,
                stepNumber: '2',
                title: 'Chụp lại dải âm bản hoặc quét lại tệp ảnh',
                description:
                    'Chụp ảnh dải âm bản trên bàn sáng với viền rebate edge rõ nét (tên phim, số frame, barcode). Nếu do chất lượng scan, hãy yêu cầu phòng Lab scan lại ở độ phân giải cao (>= 2000px, không nén quá mức).',
                icon: Icons.camera_alt_outlined,
              ),
              const SizedBox(height: 8),

              // Bước 3
              _buildStepCard(
                context,
                stepNumber: '3',
                title: 'Gửi đơn giải trình / khiếu nại tới Ban tổ chức',
                description:
                    'Nếu bạn cho rằng quyết định từ chối có sự nhầm lẫn hoặc bạn đã chuẩn bị đầy đủ chứng cứ bổ sung hợp lệ, hãy gửi giải trình trực tiếp. Ban tổ chức sẽ phúc khảo trong 24 giờ làm việc.',
                icon: Icons.rate_review_outlined,
              ),
              const SizedBox(height: 24),

              // 4. Các nút thao tác
              FilledButton.icon(
                key: const Key('rejection_appeal_button'),
                onPressed: () => _openAppealDialog(context),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: colorScheme.primary,
                  foregroundColor: colorScheme.onPrimary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.campaign_rounded),
                label: const Text(
                  'Gửi giải trình / Khiếu nại tới BTC',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 10),

              OutlinedButton.icon(
                key: const Key('negative_proof_guide_button'),
                onPressed: () => _openProofGuideDialog(context),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  side: BorderSide(color: colorScheme.primary.withValues(alpha: 0.6)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.lightbulb_outline_rounded),
                label: const Text('Xem hướng dẫn chụp ảnh dải âm bản chuẩn'),
              ),
              const SizedBox(height: 10),

              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Đóng'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStepCard(
    BuildContext context, {
    required String stepNumber,
    required String title,
    required String description,
    required IconData icon,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outlineVariant),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 13,
            backgroundColor: colorScheme.primaryContainer,
            child: Text(
              stepNumber,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: colorScheme.onPrimaryContainer,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Dialog Form nhập giải trình / khiếu nại tới Ban tổ chức
class _AppealFormDialog extends StatefulWidget {
  const _AppealFormDialog({
    required this.submission,
    required this.onSubmit,
  });

  final UserSubmission submission;
  final void Function(String category, String content) onSubmit;

  @override
  State<_AppealFormDialog> createState() => _AppealFormDialogState();
}

class _AppealFormDialogState extends State<_AppealFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  String _selectedCategory = 'Bổ sung dải âm bản đối chứng';
  bool _isSubmitting = false;

  final List<String> _categories = const [
    'Bổ sung dải âm bản đối chứng',
    'Giải trình cảnh báo AI / Bản quyền',
    'Đính chính thông số kỹ thuật / Frame',
    'Lý do kỹ thuật số hóa / Scan',
    'Khác',
  ];

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    // Giả lập gửi giải trình
    Future<void>.delayed(const Duration(milliseconds: 400), () {
      if (!mounted) return;
      widget.onSubmit(_selectedCategory, _contentController.text.trim());
      Navigator.of(context).pop();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Icon(Icons.rate_review_rounded, color: colorScheme.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Gửi giải trình cho Ban tổ chức',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Bài thi: ${widget.submission.title} (${widget.submission.displayCode})',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),

                // Phân loại giải trình
                DropdownButtonFormField<String>(
                  initialValue: _selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Phân loại giải trình *',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  isExpanded: true,
                  items: _categories.map((cat) {
                    return DropdownMenuItem<String>(
                      value: cat,
                      child: Text(cat, style: const TextStyle(fontSize: 14)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCategory = val);
                  },
                ),
                const SizedBox(height: 14),

                // Nội dung giải trình
                TextFormField(
                  key: const Key('appeal_content_field'),
                  controller: _contentController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Nội dung giải trình chi tiết *',
                    hintText:
                        'Mô tả chi tiết bằng chứng bổ sung hoặc lý do bạn yêu cầu xem xét lại (Tối thiểu 10 ký tự)...',
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().length < 10) {
                      return 'Vui lòng nhập nội dung giải trình tối thiểu 10 ký tự.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, size: 16, color: colorScheme.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Yêu cầu giải trình sẽ được lưu vết kiểm toán và gửi tới email của Ban tổ chức.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 11,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
                      child: const Text('Hủy'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      key: const Key('appeal_submit_button'),
                      onPressed: _isSubmitting ? null : _handleSubmit,
                      child: _isSubmitting
                          ? SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: colorScheme.onPrimary,
                              ),
                            )
                          : const Text('Gửi giải trình'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Dialog Hướng dẫn chụp ảnh dải phim âm bản chuẩn
class _NegativeProofGuideDialog extends StatelessWidget {
  const _NegativeProofGuideDialog();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final maxHeight = (MediaQuery.sizeOf(context).height * 0.8).clamp(360.0, 600.0);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 520, maxHeight: maxHeight),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(Icons.lightbulb_rounded, color: Colors.amber.shade800),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Chuẩn chụp ảnh Dải phim âm bản',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const Divider(height: 16),
              Expanded(
                child: ListView(
                  children: [
                    _guideItem(
                      context,
                      icon: Icons.wb_incandescent_outlined,
                      title: '1. Nguồn sáng nền (Backlight)',
                      description:
                          'Đặt dải phim lên bàn sáng chuyên dụng (Light table) hoặc mở màn hình trắng tối đa độ sáng trên iPad/máy tính bảng để làm nguồn sáng hậu kỳ.',
                    ),
                    const SizedBox(height: 12),
                    _guideItem(
                      context,
                      icon: Icons.crop_free_rounded,
                      title: '2. Viền Rebate Edge chứa mã vạch',
                      description:
                          'Chụp rõ cả viền trên và viền dưới của dải phim. Bắt buộc nhìn rõ tên phim in nổi (ví dụ: Kodak Portra 400), mã vạch DX và số thứ tự khung hình (ví dụ: Frame 24 / 24A).',
                    ),
                    const SizedBox(height: 12),
                    _guideItem(
                      context,
                      icon: Icons.view_column_rounded,
                      title: '3. Tính liên tục của cuộn phim',
                      description:
                          'Nên chụp từ 2 đến 3 khung hình liền kề trên cùng một dải để chứng minh tính xác thực, không cắt rời ảnh đơn lẻ.',
                    ),
                    const SizedBox(height: 12),
                    _guideItem(
                      context,
                      icon: Icons.center_focus_strong_rounded,
                      title: '4. Độ nét & Chống lóa (Anti-glare)',
                      description:
                          'Lấy nét chuẩn xác vào bề mặt phim để thấy hạt phim, tránh phản xạ ánh sáng phòng làm lóa mờ số khung hình.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Đã hiểu quy chuẩn'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _guideItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 20, color: colorScheme.onPrimaryContainer),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                description,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
