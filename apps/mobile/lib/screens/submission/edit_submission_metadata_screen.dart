import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/components/custom_button.dart';
import '../../core/components/custom_dropdown_field.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/data/submission_repository.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/validators.dart';
import '../../models/film_dev_scan_params.dart';
import '../../models/film_shooting_params.dart';

class EditSubmissionMetadataScreen extends ConsumerStatefulWidget {
  const EditSubmissionMetadataScreen({
    super.key,
    required this.submissionId,
    this.initialShootingParams,
    this.initialDevScanParams,
    this.submissionDeadline,
    this.submissionStatus,
    this.contestStatus,
    this.onSaved,
  });

  /// Mã bài dự thi cần chỉnh sửa
  final String submissionId;

  /// Thông số chụp hiện tại
  final FilmShootingParams? initialShootingParams;

  /// Thông số tráng scan hiện tại
  final FilmDevScanParams? initialDevScanParams;

  /// Thời hạn nhận bài thi (để kiểm tra BR-24)
  final DateTime? submissionDeadline;

  /// Trạng thái bài dự thi (để kiểm tra BR-24 và BR-19)
  final String? submissionStatus;

  /// Trạng thái cuộc thi (để kiểm tra BR-24)
  final String? contestStatus;

  /// Callback khi lưu thành công
  final void Function(
    FilmShootingParams shootingParams,
    FilmDevScanParams devScanParams,
  )? onSaved;

  @override
  ConsumerState<EditSubmissionMetadataScreen> createState() =>
      _EditSubmissionMetadataScreenState();
}

class _EditSubmissionMetadataScreenState
    extends ConsumerState<EditSubmissionMetadataScreen> {
  final _formKey = GlobalKey<FormState>();

  // Shooting Controllers
  late final TextEditingController _cameraBodyController;
  late final TextEditingController _lensController;
  late final TextEditingController _filmStockController;
  late final TextEditingController _filmBrandCustomController;
  late final TextEditingController _isoRatedController;
  late final TextEditingController _isoShotController;
  late final TextEditingController _frameNumberController;
  late final TextEditingController _locationController;
  late final TextEditingController _rollIdController;
  late final TextEditingController _shootingNotesController;

  // Dev & Scan Controllers
  late final TextEditingController _labCustomController;
  late final TextEditingController _scannerCustomController;
  late final TextEditingController _resolutionCustomController;
  late final TextEditingController _chemistryCustomController;
  late final TextEditingController _devNotesController;

  // Selections
  String _selectedBrand = 'Kodak';
  String _selectedFormat = '35mm';
  String _selectedLab = 'Llab';
  String _selectedScanner = 'Noritsu HS-1800';
  String _selectedResolution = 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)';
  String _selectedChemistry = 'C-41 (Âm bản màu)';
  String _selectedScanFormat = 'JPEG (Chuẩn)';
  bool _matchRatedIso = true;

  bool _isSaving = false;

  static const List<String> _popularBrands = [
    'Kodak',
    'Fujifilm',
    'Ilford',
    'Cinestill',
    'Fomapan',
    'Lomography',
    'Kentmere',
    'Agfa',
    'Khác',
  ];

  static const List<String> _filmFormats = [
    '35mm',
    '120 (6x4.5)',
    '120 (6x6)',
    '120 (6x7)',
    '4x5',
    '110',
    'Khác',
  ];

  static const List<String> _popularLabs = [
    'Llab',
    'Croplab',
    'Nadar Lab',
    'Zone5',
    'AEG Lab',
    'Haiphong Film Lab',
    'Darkroom Club',
    'Khác (Nhập tên Lab)',
  ];

  static const List<String> _popularScanners = [
    'Noritsu HS-1800',
    'Fuji Frontier SP-3000',
    'Fuji Frontier SP-500',
    'Pakon F135 Plus',
    'Epson Perfection V850 Pro',
    'Hasselblad Flextight X5',
    'Khác (Nhập thiết bị)',
  ];

  static const List<String> _popularResolutions = [
    'Tiêu chuẩn (2000 x 3000 ~ 6MP)',
    'Độ phân giải cao (3000 x 4500 ~ 13.5MP)',
    'Siêu cao (4000 x 6000 ~ 24MP)',
    '2400 DPI (Máy scan phẳng)',
    '3200 DPI (Máy scan phẳng)',
    'Khác (Tự nhập độ phân giải)',
  ];

  static const List<String> _chemistries = [
    'C-41 (Âm bản màu)',
    'B&W (Đen trắng chuẩn D-76 / XTOL)',
    'E-6 (Dương bản / Slide)',
    'ECN-2 (Phim điện ảnh / Cine)',
    'Khác',
  ];

  static const List<String> _scanFormats = [
    'JPEG (Chuẩn)',
    'TIFF 8-bit',
    'TIFF 16-bit',
  ];

  static const List<int> _quickIsoList = [
    100,
    200,
    400,
    800,
    1600,
    3200,
  ];

  @override
  void initState() {
    super.initState();
    _initFormValues();
  }

  void _initFormValues() {
    final shooting = widget.initialShootingParams;
    final devScan = widget.initialDevScanParams;

    _cameraBodyController =
        TextEditingController(text: shooting?.cameraBody ?? '');
    _lensController = TextEditingController(text: shooting?.lens ?? '');
    _filmStockController =
        TextEditingController(text: shooting?.filmStock ?? '');
    _frameNumberController =
        TextEditingController(text: shooting?.frameNumber ?? '');
    _locationController = TextEditingController(text: shooting?.location ?? '');
    _rollIdController = TextEditingController(text: shooting?.rollId ?? '');
    _shootingNotesController =
        TextEditingController(text: shooting?.notes ?? '');

    final brand = shooting?.filmBrand ?? 'Kodak';
    if (_popularBrands.contains(brand)) {
      _selectedBrand = brand;
      _filmBrandCustomController = TextEditingController();
    } else {
      _selectedBrand = 'Khác';
      _filmBrandCustomController = TextEditingController(text: brand);
    }

    final format = shooting?.filmFormat ?? '35mm';
    if (_filmFormats.contains(format)) {
      _selectedFormat = format;
    } else if (format.contains('120') && format.contains('645')) {
      _selectedFormat = '120 (6x4.5)';
    } else if (format.contains('120') && format.contains('67')) {
      _selectedFormat = '120 (6x7)';
    } else if (format.contains('120')) {
      _selectedFormat = '120 (6x6)';
    } else {
      _selectedFormat = '35mm';
    }

    final rated = shooting?.isoRated ?? 400;
    final shot = shooting?.isoShot ?? rated;
    _isoRatedController = TextEditingController(text: rated.toString());
    _isoShotController = TextEditingController(text: shot.toString());
    _matchRatedIso = rated == shot;

    // Dev & Scan
    final lab = devScan?.labName ?? shooting?.devLabName ?? 'Llab';
    if (_popularLabs.contains(lab)) {
      _selectedLab = lab;
      _labCustomController = TextEditingController();
    } else {
      _selectedLab = 'Khác (Nhập tên Lab)';
      _labCustomController = TextEditingController(text: lab);
    }

    final scanner =
        devScan?.scannerModel ?? shooting?.scannerModel ?? 'Noritsu HS-1800';
    if (_popularScanners.contains(scanner)) {
      _selectedScanner = scanner;
      _scannerCustomController = TextEditingController();
    } else {
      _selectedScanner = 'Khác (Nhập thiết bị)';
      _scannerCustomController = TextEditingController(text: scanner);
    }

    final res = devScan?.scanResolution ??
        'Độ phân giải cao (3000 x 4500 ~ 13.5MP)';
    if (_popularResolutions.contains(res)) {
      _selectedResolution = res;
      _resolutionCustomController = TextEditingController();
    } else {
      _selectedResolution = 'Khác (Tự nhập độ phân giải)';
      _resolutionCustomController = TextEditingController(text: res);
    }

    final chemistry =
        devScan?.devChemistry ?? shooting?.devChemistry ?? 'C-41 (Âm bản màu)';
    if (_chemistries.contains(chemistry)) {
      _selectedChemistry = chemistry;
      _chemistryCustomController = TextEditingController();
    } else {
      _selectedChemistry = 'Khác';
      _chemistryCustomController = TextEditingController(text: chemistry);
    }

    final scanFmt = devScan?.scanFormat ?? 'JPEG (Chuẩn)';
    _selectedScanFormat =
        _scanFormats.contains(scanFmt) ? scanFmt : 'JPEG (Chuẩn)';

    _devNotesController = TextEditingController(text: devScan?.notes ?? '');
  }

  @override
  void dispose() {
    _cameraBodyController.dispose();
    _lensController.dispose();
    _filmStockController.dispose();
    _filmBrandCustomController.dispose();
    _isoRatedController.dispose();
    _isoShotController.dispose();
    _frameNumberController.dispose();
    _locationController.dispose();
    _rollIdController.dispose();
    _shootingNotesController.dispose();

    _labCustomController.dispose();
    _scannerCustomController.dispose();
    _resolutionCustomController.dispose();
    _chemistryCustomController.dispose();
    _devNotesController.dispose();
    super.dispose();
  }

  // --- BR-24 Checks ---
  bool get isDeadlinePassed {
    if (widget.submissionDeadline == null) return false;
    return !DateTime.now().isBefore(widget.submissionDeadline!);
  }

  bool get isJudgingOrLocked {
    final subStatus = widget.submissionStatus?.trim().toUpperCase();
    const lockedSubStatuses = {
      'APPROVED_FOR_JUDGING',
      'JUDGING',
      'DISQUALIFIED',
      'DISQUALIFIED_NO_PROOF',
      'WITHDRAWN',
    };
    if (subStatus != null && lockedSubStatuses.contains(subStatus)) {
      return true;
    }

    final cStatus = widget.contestStatus?.trim().toUpperCase();
    const lockedContestStatuses = {
      'JUDGING',
      'COMPLETED',
      'ARCHIVED',
      'CANCELLED',
    };
    if (cStatus != null && lockedContestStatuses.contains(cStatus)) {
      return true;
    }

    return false;
  }

  bool get isLockedByBr24 => isDeadlinePassed || isJudgingOrLocked;

  bool get isProofRequested =>
      widget.submissionStatus?.trim().toUpperCase() == 'PROOF_REQUESTED';

  // --- BR-23 Physical Frame Limits ---
  static int maxFramesForFormat(String format) {
    final normalized = format.trim().toLowerCase();
    if (normalized.contains('135') || normalized.contains('35mm')) {
      return 39;
    }
    if (normalized.contains('645') || normalized.contains('6x4.5')) {
      return 16;
    }
    if (normalized.contains('67') || normalized.contains('6x7')) {
      return 10;
    }
    if (normalized.contains('120') ||
        normalized.contains('66') ||
        normalized.contains('6x6')) {
      return 12;
    }
    if (normalized.contains('4x5')) {
      return 1;
    }
    return 39;
  }

  String? _validateFrameNumber(String? value) {
    final emptyCheck =
        Validators.notEmpty(value, field: 'Số frame trên cuộn phim');
    if (emptyCheck != null) return emptyCheck;

    final trimmed = value!.trim();
    final match = RegExp(r'^(\d+)').firstMatch(trimmed);
    if (match == null) {
      return 'Số frame phải bắt đầu bằng số (ví dụ: 12 hoặc 12A)';
    }

    final frameNum = int.tryParse(match.group(1)!);
    final maxLimit = maxFramesForFormat(_selectedFormat);
    if (frameNum == null || frameNum < 0 || frameNum > maxLimit) {
      return 'Khổ $_selectedFormat tối đa $maxLimit frame theo BR-23';
    }

    return null;
  }

  String _getPushPullText(int rated, int shot) {
    if (rated == shot) return 'Độ nhạy chuẩn';
    if (shot > rated) {
      return 'Push ISO ($rated -> $shot)';
    } else {
      return 'Pull ISO ($rated -> $shot)';
    }
  }

  void _onRatedIsoChanged(String value) {
    if (_matchRatedIso) {
      _isoShotController.text = value;
    }
    setState(() {});
  }

  void _selectQuickIso(int iso) {
    if (isLockedByBr24) return;
    setState(() {
      _isoRatedController.text = iso.toString();
      if (_matchRatedIso) {
        _isoShotController.text = iso.toString();
      }
    });
  }

  Future<void> _handleSave() async {
    if (isLockedByBr24) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isDeadlinePassed
                ? 'Đã hết hạn nộp bài (BR-24). Không thể cập nhật metadata.'
                : 'Bài thi đang trong vòng chấm điểm (BR-24). Không thể cập nhật metadata.',
          ),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final finalBrand = _selectedBrand == 'Khác'
        ? _filmBrandCustomController.text.trim()
        : _selectedBrand;

    final finalLab = _selectedLab == 'Khác (Nhập tên Lab)'
        ? _labCustomController.text.trim()
        : _selectedLab;

    final finalScanner = _selectedScanner == 'Khác (Nhập thiết bị)'
        ? _scannerCustomController.text.trim()
        : _selectedScanner;

    final finalResolution =
        _selectedResolution == 'Khác (Tự nhập độ phân giải)'
            ? _resolutionCustomController.text.trim()
            : _selectedResolution;

    final finalChemistry = _selectedChemistry == 'Khác'
        ? _chemistryCustomController.text.trim()
        : _selectedChemistry;

    final rated = int.tryParse(_isoRatedController.text.trim()) ?? 400;
    final shot = _matchRatedIso
        ? rated
        : (int.tryParse(_isoShotController.text.trim()) ?? rated);

    final shootingParams = FilmShootingParams(
      cameraBody: _cameraBodyController.text.trim(),
      lens: _lensController.text.trim().isEmpty
          ? null
          : _lensController.text.trim(),
      filmStock: _filmStockController.text.trim(),
      filmBrand: finalBrand,
      filmFormat: _selectedFormat,
      isoRated: rated,
      isoShot: shot,
      frameNumber: _frameNumberController.text.trim().isEmpty
          ? null
          : _frameNumberController.text.trim(),
      rollId: _rollIdController.text.trim().isEmpty
          ? null
          : _rollIdController.text.trim(),
      location: _locationController.text.trim().isEmpty
          ? null
          : _locationController.text.trim(),
      devLabName: finalLab,
      devChemistry: finalChemistry,
      scannerModel: finalScanner,
      notes: _shootingNotesController.text.trim().isEmpty
          ? null
          : _shootingNotesController.text.trim(),
    );

    final devScanParams = FilmDevScanParams(
      labName: finalLab,
      scannerModel: finalScanner,
      scanResolution: finalResolution,
      devChemistry: finalChemistry,
      scanFormat: _selectedScanFormat,
      notes: _devNotesController.text.trim().isEmpty
          ? null
          : _devNotesController.text.trim(),
    );

    setState(() => _isSaving = true);

    try {
      final repo = ref.read(submissionMetadataRepositoryProvider);
      await repo.updateSubmissionMetadata(
        submissionId: widget.submissionId,
        shootingParams: shootingParams,
        devScanParams: devScanParams,
      );

      if (!mounted) return;
      setState(() => _isSaving = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cập nhật thông số metadata thành công!'),
          backgroundColor: Colors.green,
        ),
      );

      widget.onSaved?.call(shootingParams, devScanParams);
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSaving = false);

      final message = error is ApiException
          ? error.message
          : 'Lỗi cập nhật metadata: $error';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      // Giữ nguyên dữ liệu trên form, không xóa thông tin đã nhập
    }
  }

  void _handleReset() {
    if (isLockedByBr24) return;
    setState(() {
      _formKey.currentState?.reset();
      _resetToInitialValues();
    });
  }

  void _resetToInitialValues() {
    final shooting = widget.initialShootingParams;
    final devScan = widget.initialDevScanParams;

    _cameraBodyController.text = shooting?.cameraBody ?? '';
    _lensController.text = shooting?.lens ?? '';
    _filmStockController.text = shooting?.filmStock ?? '';
    _frameNumberController.text = shooting?.frameNumber ?? '';
    _locationController.text = shooting?.location ?? '';
    _rollIdController.text = shooting?.rollId ?? '';
    _shootingNotesController.text = shooting?.notes ?? '';

    final brand = shooting?.filmBrand ?? 'Kodak';
    if (_popularBrands.contains(brand)) {
      _selectedBrand = brand;
      _filmBrandCustomController.text = '';
    } else {
      _selectedBrand = 'Khác';
      _filmBrandCustomController.text = brand;
    }

    final format = shooting?.filmFormat ?? '35mm';
    if (_filmFormats.contains(format)) {
      _selectedFormat = format;
    } else if (format.contains('120') && format.contains('645')) {
      _selectedFormat = '120 (6x4.5)';
    } else if (format.contains('120') && format.contains('67')) {
      _selectedFormat = '120 (6x7)';
    } else if (format.contains('120')) {
      _selectedFormat = '120 (6x6)';
    } else {
      _selectedFormat = '35mm';
    }

    final rated = shooting?.isoRated ?? 400;
    final shot = shooting?.isoShot ?? rated;
    _isoRatedController.text = rated.toString();
    _isoShotController.text = shot.toString();
    _matchRatedIso = rated == shot;

    // Dev & Scan
    final lab = devScan?.labName ?? shooting?.devLabName ?? 'Llab';
    if (_popularLabs.contains(lab)) {
      _selectedLab = lab;
      _labCustomController.text = '';
    } else {
      _selectedLab = 'Khác (Nhập tên Lab)';
      _labCustomController.text = lab;
    }

    final scanner =
        devScan?.scannerModel ?? shooting?.scannerModel ?? 'Noritsu HS-1800';
    if (_popularScanners.contains(scanner)) {
      _selectedScanner = scanner;
      _scannerCustomController.text = '';
    } else {
      _selectedScanner = 'Khác (Nhập thiết bị)';
      _scannerCustomController.text = scanner;
    }

    final res = devScan?.scanResolution ??
        'Độ phân giải cao (3000 x 4500 ~ 13.5MP)';
    if (_popularResolutions.contains(res)) {
      _selectedResolution = res;
      _resolutionCustomController.text = '';
    } else {
      _selectedResolution = 'Khác (Tự nhập độ phân giải)';
      _resolutionCustomController.text = res;
    }

    final chemistry =
        devScan?.devChemistry ?? shooting?.devChemistry ?? 'C-41 (Âm bản màu)';
    if (_chemistries.contains(chemistry)) {
      _selectedChemistry = chemistry;
      _chemistryCustomController.text = '';
    } else {
      _selectedChemistry = 'Khác';
      _chemistryCustomController.text = chemistry;
    }

    final scanFmt = devScan?.scanFormat ?? 'JPEG (Chuẩn)';
    _selectedScanFormat =
        _scanFormats.contains(scanFmt) ? scanFmt : 'JPEG (Chuẩn)';

    _devNotesController.text = devScan?.notes ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final ratedIso = int.tryParse(_isoRatedController.text.trim()) ?? 400;
    final shotIso = _matchRatedIso
        ? ratedIso
        : (int.tryParse(_isoShotController.text.trim()) ?? ratedIso);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chỉnh sửa Metadata bài thi'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(24),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(
              'Mã bài thi: ${widget.submissionId}',
              style: theme.textTheme.labelMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // BR-24 Lock Banner
              if (isLockedByBr24) ...[
                Card(
                  color: colorScheme.errorContainer,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: colorScheme.error),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          isDeadlinePassed
                              ? Icons.lock_clock_outlined
                              : Icons.gavel_outlined,
                          color: colorScheme.onErrorContainer,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isDeadlinePassed
                                    ? 'Khóa chỉnh sửa do quá hạn (BR-24)'
                                    : 'Khóa chỉnh sửa do đang chấm (BR-24)',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: colorScheme.onErrorContainer,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isDeadlinePassed
                                    ? 'Đã hết thời hạn nhận bài thi của cuộc thi. Thí sinh không thể chỉnh sửa thông số metadata sau thời hạn này.'
                                    : 'Bài thi đang trong vòng chấm điểm hoặc đã kết thúc (${widget.submissionStatus ?? widget.contestStatus}). Theo quy định BR-24, dữ liệu kỹ thuật không thể chỉnh sửa.',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onErrorContainer,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // BR-19 Reminder Banner
              if (isProofRequested) ...[
                Card(
                  color: colorScheme.primaryContainer,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: colorScheme.primary),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: colorScheme.onPrimaryContainer,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Yêu cầu bổ sung âm bản (PROOF_REQUESTED)',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: colorScheme.onPrimaryContainer,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Bài thi đang có yêu cầu bổ sung ảnh dải âm bản gốc trong vòng 48 giờ (BR-19). Lưu ý: Màn hình này dùng để chỉnh sửa thông số kỹ thuật (metadata), không thay thế việc nộp ảnh đối chứng âm bản.',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onPrimaryContainer,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Section 1: Thông số chụp phim
              Text(
                '1. Thông số chụp phim (Shooting Metadata)',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                elevation: 0,
                color: colorScheme.surfaceContainerLow,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: colorScheme.outlineVariant),
                ),
                child: AbsorbPointer(
                  absorbing: isLockedByBr24,
                  child: Opacity(
                    opacity: isLockedByBr24 ? 0.6 : 1.0,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Camera Body (BR-22)
                          CustomInputField(
                            controller: _cameraBodyController,
                            labelText: 'Thân máy ảnh (Camera Body) *',
                            hintText: 'Ví dụ: Leica M6, Canon AE-1, Nikon FM2...',
                            prefixIcon: const Icon(Icons.camera_alt_outlined),
                            validator: (value) => Validators.notEmpty(
                              value,
                              field: 'Thân máy ảnh',
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Lens
                          CustomInputField(
                            controller: _lensController,
                            labelText: 'Ống kính (Lens)',
                            hintText: 'Ví dụ: Summicron 35mm f/2, FD 50mm f/1.4...',
                            prefixIcon: const Icon(Icons.camera_outlined),
                          ),
                          const SizedBox(height: 14),

                          // Film Brand
                          CustomDropdownField<String>(
                            value: _selectedBrand,
                            items: _popularBrands
                                .map(
                                  (b) => DropdownItem(value: b, label: b),
                                )
                                .toList(),
                            labelText: 'Hãng phim (Film Brand) *',
                            prefixIcon:
                                const Icon(Icons.branding_watermark_outlined),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedBrand = val);
                              }
                            },
                          ),
                          if (_selectedBrand == 'Khác') ...[
                            const SizedBox(height: 10),
                            CustomInputField(
                              controller: _filmBrandCustomController,
                              labelText: 'Nhập tên hãng phim *',
                              hintText: 'Tên hãng phim khác...',
                              validator: (value) => _selectedBrand == 'Khác'
                                  ? Validators.notEmpty(
                                      value,
                                      field: 'Tên hãng phim',
                                    )
                                  : null,
                            ),
                          ],
                          const SizedBox(height: 14),

                          // Film Stock (BR-22)
                          CustomInputField(
                            controller: _filmStockController,
                            labelText: 'Tên cuộn phim (Film Stock) *',
                            hintText: 'Ví dụ: Portra 400, Tri-X 400, HP5 Plus...',
                            prefixIcon: const Icon(Icons.movie_filter_outlined),
                            validator: (value) => Validators.notEmpty(
                              value,
                              field: 'Tên cuộn phim',
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Film Format (BR-22)
                          CustomDropdownField<String>(
                            value: _selectedFormat,
                            items: _filmFormats
                                .map(
                                  (f) => DropdownItem(value: f, label: f),
                                )
                                .toList(),
                            labelText: 'Khổ phim (Format) *',
                            prefixIcon: const Icon(Icons.crop_original_outlined),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedFormat = val);
                              }
                            },
                          ),
                          const SizedBox(height: 14),

                          // Frame Number (BR-22 & BR-23)
                          CustomInputField(
                            controller: _frameNumberController,
                            labelText: 'Số Frame trên cuộn phim *',
                            hintText: 'Ví dụ: 14, 00, 36A...',
                            prefixIcon: const Icon(Icons.format_list_numbered),
                            validator: _validateFrameNumber,
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 4, left: 12),
                            child: Text(
                              'Giới hạn vật lý: tối đa ${maxFramesForFormat(_selectedFormat)} frame theo BR-23',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // ISO Rated & ISO Shot
                          Row(
                            children: [
                              Expanded(
                                child: CustomInputField(
                                  controller: _isoRatedController,
                                  labelText: 'ISO hộp phim *',
                                  keyboardType: TextInputType.number,
                                  prefixIcon: const Icon(Icons.iso_outlined),
                                  onChanged: _onRatedIsoChanged,
                                  validator: (val) => Validators.positiveInteger(
                                    val,
                                    field: 'ISO hộp phim',
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: CustomInputField(
                                  controller: _isoShotController,
                                  labelText: 'ISO thực tế chụp *',
                                  keyboardType: TextInputType.number,
                                  prefixIcon:
                                      const Icon(Icons.shutter_speed_outlined),
                                  validator: (val) => Validators.positiveInteger(
                                    val,
                                    field: 'ISO thực tế',
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Push/Pull Toggle & Indicator
                          Row(
                            children: [
                              Checkbox(
                                value: _matchRatedIso,
                                onChanged: (checked) {
                                  setState(() {
                                    _matchRatedIso = checked ?? true;
                                    if (_matchRatedIso) {
                                      _isoShotController.text =
                                          _isoRatedController.text;
                                    }
                                  });
                                },
                              ),
                              Expanded(
                                child: Text(
                                  'Chụp đúng ISO chuẩn (không Push/Pull)',
                                  style: theme.textTheme.bodyMedium,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: ratedIso != shotIso
                                      ? colorScheme.secondaryContainer
                                      : colorScheme.surfaceContainerHighest,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  _getPushPullText(ratedIso, shotIso),
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: ratedIso != shotIso
                                        ? colorScheme.onSecondaryContainer
                                        : colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),

                          // Quick ISO Chips
                          Wrap(
                            spacing: 8,
                            children: _quickIsoList.map((iso) {
                              final isSelected = ratedIso == iso;
                              return ActionChip(
                                label: Text('ISO $iso'),
                                backgroundColor: isSelected
                                    ? colorScheme.primaryContainer
                                    : null,
                                labelStyle: TextStyle(
                                  color: isSelected
                                      ? colorScheme.onPrimaryContainer
                                      : null,
                                  fontWeight: isSelected ? FontWeight.bold : null,
                                ),
                                onPressed: () => _selectQuickIso(iso),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 14),

                          // Location (Địa điểm chụp)
                          CustomInputField(
                            controller: _locationController,
                            labelText: 'Địa điểm chụp ảnh',
                            hintText: 'Ví dụ: Phố cổ Hà Nội, Đà Lạt, Hội An...',
                            prefixIcon: const Icon(Icons.location_on_outlined),
                          ),
                          const SizedBox(height: 14),

                          // Roll ID
                          CustomInputField(
                            controller: _rollIdController,
                            labelText: 'Mã cuộn phim / Roll ID',
                            hintText: 'Ví dụ: ROLL-2026-001 (tùy chọn)',
                            prefixIcon: const Icon(Icons.fingerprint_outlined),
                          ),
                          const SizedBox(height: 14),

                          // Shooting Notes
                          CustomInputField(
                            controller: _shootingNotesController,
                            labelText: 'Ghi chú chụp phim',
                            hintText: 'Điều kiện ánh sáng, bối cảnh sáng tác...',
                            prefixIcon: const Icon(Icons.notes_outlined),
                            maxLines: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Section 2: Thông số tráng scan
              Text(
                '2. Thông số tráng & scan (Dev & Scan Metadata)',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                elevation: 0,
                color: colorScheme.surfaceContainerLow,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: colorScheme.outlineVariant),
                ),
                child: AbsorbPointer(
                  absorbing: isLockedByBr24,
                  child: Opacity(
                    opacity: isLockedByBr24 ? 0.6 : 1.0,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Lab Name (BR-22)
                          CustomDropdownField<String>(
                            value: _selectedLab,
                            items: _popularLabs
                                .map(
                                  (l) => DropdownItem(value: l, label: l),
                                )
                                .toList(),
                            labelText: 'Phòng Lab tráng & scan *',
                            prefixIcon: const Icon(Icons.science_outlined),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedLab = val);
                              }
                            },
                          ),
                          if (_selectedLab == 'Khác (Nhập tên Lab)') ...[
                            const SizedBox(height: 10),
                            CustomInputField(
                              controller: _labCustomController,
                              labelText: 'Nhập tên phòng Lab *',
                              hintText: 'Tên phòng Lab...',
                              validator: (value) => _selectedLab ==
                                      'Khác (Nhập tên Lab)'
                                  ? Validators.notEmpty(
                                      value,
                                      field: 'Tên phòng Lab',
                                    )
                                  : null,
                            ),
                          ],
                          const SizedBox(height: 14),

                          // Dev Chemistry
                          CustomDropdownField<String>(
                            value: _selectedChemistry,
                            items: _chemistries
                                .map(
                                  (c) => DropdownItem(value: c, label: c),
                                )
                                .toList(),
                            labelText: 'Hóa chất / Quy trình tráng',
                            prefixIcon: const Icon(Icons.opacity_outlined),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedChemistry = val);
                              }
                            },
                          ),
                          if (_selectedChemistry == 'Khác') ...[
                            const SizedBox(height: 10),
                            CustomInputField(
                              controller: _chemistryCustomController,
                              labelText: 'Nhập quy trình tráng khác',
                              hintText: 'Tên quy trình / hóa chất...',
                            ),
                          ],
                          const SizedBox(height: 14),

                          // Scanner Model
                          CustomDropdownField<String>(
                            value: _selectedScanner,
                            items: _popularScanners
                                .map(
                                  (s) => DropdownItem(value: s, label: s),
                                )
                                .toList(),
                            labelText: 'Thiết bị Scanner',
                            prefixIcon: const Icon(Icons.scanner_outlined),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedScanner = val);
                              }
                            },
                          ),
                          if (_selectedScanner == 'Khác (Nhập thiết bị)') ...[
                            const SizedBox(height: 10),
                            CustomInputField(
                              controller: _scannerCustomController,
                              labelText: 'Nhập thiết bị scan',
                              hintText: 'Tên máy scan...',
                            ),
                          ],
                          const SizedBox(height: 14),

                          // Scan Resolution
                          CustomDropdownField<String>(
                            value: _selectedResolution,
                            items: _popularResolutions
                                .map(
                                  (r) => DropdownItem(value: r, label: r),
                                )
                                .toList(),
                            labelText: 'Độ phân giải scan',
                            prefixIcon: const Icon(Icons.high_quality_outlined),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedResolution = val);
                              }
                            },
                          ),
                          if (_selectedResolution ==
                              'Khác (Tự nhập độ phân giải)') ...[
                            const SizedBox(height: 10),
                            CustomInputField(
                              controller: _resolutionCustomController,
                              labelText: 'Nhập độ phân giải scan',
                              hintText: 'Ví dụ: 3000 x 4500 hoặc 3200 DPI...',
                            ),
                          ],
                          const SizedBox(height: 14),

                          // Scan File Format
                          CustomDropdownField<String>(
                            value: _selectedScanFormat,
                            items: _scanFormats
                                .map(
                                  (f) => DropdownItem(value: f, label: f),
                                )
                                .toList(),
                            labelText: 'Định dạng file scan',
                            prefixIcon:
                                const Icon(Icons.insert_drive_file_outlined),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedScanFormat = val);
                              }
                            },
                          ),
                          const SizedBox(height: 14),

                          // Dev Notes
                          CustomInputField(
                            controller: _devNotesController,
                            labelText: 'Ghi chú tráng scan',
                            hintText: 'Lưu ý nhiệt độ, profile màu scanner...',
                            prefixIcon: const Icon(Icons.note_alt_outlined),
                            maxLines: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Action Buttons
              CustomButton(
                label: 'Lưu thay đổi metadata',
                icon: const Icon(Icons.save_outlined),
                isLoading: _isSaving,
                onPressed: isLockedByBr24 ? null : _handleSave,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: const Icon(Icons.refresh_outlined),
                label: const Text('Đặt lại ban đầu'),
                onPressed: isLockedByBr24 || _isSaving ? null : _handleReset,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
