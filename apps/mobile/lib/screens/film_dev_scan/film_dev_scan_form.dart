import 'package:flutter/material.dart';

import '../../core/components/custom_button.dart';
import '../../core/components/custom_dropdown_field.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/utils/validators.dart';
import '../../models/film_dev_scan_params.dart';

class FilmDevScanForm extends StatefulWidget {
  const FilmDevScanForm({
    super.key,
    this.initialParams,
    required this.onSubmit,
    this.onReset,
    this.isLoading = false,
    this.submitButtonLabel = 'Lưu thông tin tráng scan',
  });

  final FilmDevScanParams? initialParams;
  final ValueChanged<FilmDevScanParams> onSubmit;
  final VoidCallback? onReset;
  final bool isLoading;
  final String submitButtonLabel;

  @override
  State<FilmDevScanForm> createState() => _FilmDevScanFormState();
}

class _FilmDevScanFormState extends State<FilmDevScanForm> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  late final TextEditingController _labCustomController;
  late final TextEditingController _scannerCustomController;
  late final TextEditingController _resolutionCustomController;
  late final TextEditingController _chemistryCustomController;
  late final TextEditingController _notesController;

  // Selected dropdown values
  String _selectedLab = 'Llab';
  String _selectedScanner = 'Noritsu HS-1800';
  String _selectedResolution = 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)';
  String _selectedChemistry = 'C-41 (Âm bản màu)';
  String _selectedFormat = 'JPEG (Chuẩn)';
  bool _isAdvancedExpanded = false;

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
    'DSLR / Mirrorless Scanning',
    'Khác (Nhập thiết bị)',
  ];

  static const List<String> _popularResolutions = [
    'Tiêu chuẩn (2000 x 3000 ~ 6MP)',
    'Độ phân giải cao (3000 x 4500 ~ 13.5MP)',
    'Siêu cao (4000 x 6000 ~ 24MP)',
    'Tối đa (6000 x 9000 ~ 54MP)',
    '2400 DPI (Máy scan phẳng)',
    '3200 DPI (Máy scan phẳng)',
    '4800 DPI (Máy scan phẳng)',
    'Khác (Tự nhập độ phân giải)',
  ];

  static const List<String> _chemistries = [
    'C-41 (Âm bản màu)',
    'B&W (Đen trắng chuẩn D-76 / XTOL)',
    'E-6 (Dương bản / Slide)',
    'ECN-2 (Phim điện ảnh / Cine)',
    'Khác',
  ];

  static const List<String> _formats = [
    'JPEG (Chuẩn)',
    'TIFF 8-bit',
    'TIFF 16-bit',
  ];

  @override
  void initState() {
    super.initState();
    final init = widget.initialParams;

    final initialLab = init?.labName ?? 'Llab';
    if (_popularLabs.contains(initialLab)) {
      _selectedLab = initialLab;
      _labCustomController = TextEditingController();
    } else if (initialLab.isNotEmpty) {
      _selectedLab = 'Khác (Nhập tên Lab)';
      _labCustomController = TextEditingController(text: initialLab);
    } else {
      _selectedLab = 'Llab';
      _labCustomController = TextEditingController();
    }

    final initialScanner = init?.scannerModel ?? 'Noritsu HS-1800';
    if (_popularScanners.contains(initialScanner)) {
      _selectedScanner = initialScanner;
      _scannerCustomController = TextEditingController();
    } else if (initialScanner.isNotEmpty) {
      _selectedScanner = 'Khác (Nhập thiết bị)';
      _scannerCustomController = TextEditingController(text: initialScanner);
    } else {
      _selectedScanner = 'Noritsu HS-1800';
      _scannerCustomController = TextEditingController();
    }

    final initialRes =
        init?.scanResolution ?? 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)';
    if (_popularResolutions.contains(initialRes)) {
      _selectedResolution = initialRes;
      _resolutionCustomController = TextEditingController();
    } else if (initialRes.isNotEmpty) {
      _selectedResolution = 'Khác (Tự nhập độ phân giải)';
      _resolutionCustomController = TextEditingController(text: initialRes);
    } else {
      _selectedResolution = 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)';
      _resolutionCustomController = TextEditingController();
    }

    final initialChem = init?.devChemistry ?? 'C-41 (Âm bản màu)';
    if (_chemistries.contains(initialChem)) {
      _selectedChemistry = initialChem;
      _chemistryCustomController = TextEditingController();
    } else if (initialChem.isNotEmpty) {
      _selectedChemistry = 'Khác';
      _chemistryCustomController = TextEditingController(text: initialChem);
    } else {
      _selectedChemistry = 'C-41 (Âm bản màu)';
      _chemistryCustomController = TextEditingController();
    }

    _selectedFormat = init?.scanFormat ?? 'JPEG (Chuẩn)';
    if (!_formats.contains(_selectedFormat)) {
      _selectedFormat = 'JPEG (Chuẩn)';
    }

    _notesController = TextEditingController(text: init?.notes ?? '');
  }

  @override
  void dispose() {
    _labCustomController.dispose();
    _scannerCustomController.dispose();
    _resolutionCustomController.dispose();
    _chemistryCustomController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    if (!_formKey.currentState!.validate()) return;

    final finalLab = _selectedLab == 'Khác (Nhập tên Lab)'
        ? _labCustomController.text.trim()
        : _selectedLab;

    final finalScanner = _selectedScanner == 'Khác (Nhập thiết bị)'
        ? _scannerCustomController.text.trim()
        : _selectedScanner;

    final finalResolution = _selectedResolution == 'Khác (Tự nhập độ phân giải)'
        ? _resolutionCustomController.text.trim()
        : _selectedResolution;

    final finalChemistry = _selectedChemistry == 'Khác'
        ? _chemistryCustomController.text.trim()
        : _selectedChemistry;

    final params = FilmDevScanParams(
      labName: finalLab,
      scannerModel: finalScanner,
      scanResolution: finalResolution,
      devChemistry: finalChemistry.isEmpty ? null : finalChemistry,
      scanFormat: _selectedFormat,
      notes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
    );

    widget.onSubmit(params);
  }

  void _handleReset() {
    _formKey.currentState?.reset();
    _labCustomController.clear();
    _scannerCustomController.clear();
    _resolutionCustomController.clear();
    _chemistryCustomController.clear();
    _notesController.clear();

    setState(() {
      _selectedLab = 'Llab';
      _selectedScanner = 'Noritsu HS-1800';
      _selectedResolution = 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)';
      _selectedChemistry = 'C-41 (Âm bản màu)';
      _selectedFormat = 'JPEG (Chuẩn)';
    });

    widget.onReset?.call();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Card Giới thiệu
          Card(
            elevation: 0,
            color: colorScheme.secondaryContainer.withValues(alpha: 0.4),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: colorScheme.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    Icons.science_outlined,
                    color: colorScheme.primary,
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Thông tin tráng & scan phim',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Điền thông tin Lab tráng, máy scan và độ phân giải xuất file theo yêu cầu cuộc thi.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Section 1: Thông tin Lab tráng (Tên Lab)
          _buildSectionHeader(
            icon: Icons.storefront_outlined,
            title: '1. Thông tin Lab tráng phim *',
            colorScheme: colorScheme,
          ),
          const SizedBox(height: 12),
          CustomDropdownField<String>(
            value: _selectedLab,
            labelText: 'Chọn tên Lab tráng phim *',
            prefixIcon: const Icon(Icons.business_outlined),
            items: _popularLabs
                .map((lab) => DropdownItem(value: lab, label: lab))
                .toList(),
            onChanged: (val) {
              if (val != null) setState(() => _selectedLab = val);
            },
          ),
          if (_selectedLab == 'Khác (Nhập tên Lab)') ...[
            const SizedBox(height: 12),
            CustomInputField(
              controller: _labCustomController,
              labelText: 'Nhập tên Lab tráng *',
              hintText: 'Ví dụ: Llab, Croplab, Nadar Lab, Zone5...',
              prefixIcon: const Icon(Icons.edit_location_alt_outlined),
              validator: (v) =>
                  Validators.notEmpty(v, field: 'Tên Lab tráng') ??
                  Validators.maxLength(v, 150, field: 'Tên Lab tráng'),
            ),
          ],

          const SizedBox(height: 24),

          // Section 2: Thiết bị scan (Máy scan)
          _buildSectionHeader(
            icon: Icons.scanner_outlined,
            title: '2. Thiết bị scan (Scanner) *',
            colorScheme: colorScheme,
          ),
          const SizedBox(height: 12),
          CustomDropdownField<String>(
            value: _selectedScanner,
            labelText: 'Chọn thiết bị scan *',
            prefixIcon: const Icon(Icons.scanner_outlined),
            items: _popularScanners
                .map((s) => DropdownItem(value: s, label: s))
                .toList(),
            onChanged: (val) {
              if (val != null) setState(() => _selectedScanner = val);
            },
          ),
          if (_selectedScanner == 'Khác (Nhập thiết bị)') ...[
            const SizedBox(height: 12),
            CustomInputField(
              controller: _scannerCustomController,
              labelText: 'Nhập tên thiết bị scan *',
              hintText: 'Ví dụ: Noritsu HS-1800, Fuji SP-3000, Epson V850...',
              prefixIcon: const Icon(Icons.edit_note_outlined),
              validator: (v) =>
                  Validators.notEmpty(v, field: 'Thiết bị scan') ??
                  Validators.maxLength(v, 150, field: 'Thiết bị scan'),
            ),
          ],

          const SizedBox(height: 24),

          // Section 3: Độ phân giải scan
          _buildSectionHeader(
            icon: Icons.photo_size_select_actual_outlined,
            title: '3. Độ phân giải scan (Resolution) *',
            colorScheme: colorScheme,
          ),
          const SizedBox(height: 12),
          CustomDropdownField<String>(
            value: _selectedResolution,
            labelText: 'Chọn độ phân giải scan *',
            prefixIcon: const Icon(Icons.high_quality_outlined),
            items: _popularResolutions
                .map((r) => DropdownItem(value: r, label: r))
                .toList(),
            onChanged: (val) {
              if (val != null) setState(() => _selectedResolution = val);
            },
          ),
          if (_selectedResolution == 'Khác (Tự nhập độ phân giải)') ...[
            const SizedBox(height: 12),
            CustomInputField(
              controller: _resolutionCustomController,
              labelText: 'Nhập độ phân giải scan *',
              hintText: 'Ví dụ: 3000 x 4500 px hoặc 3200 DPI...',
              prefixIcon: const Icon(Icons.aspect_ratio_outlined),
              validator: (v) =>
                  Validators.notEmpty(v, field: 'Độ phân giải scan') ??
                  Validators.maxLength(v, 100, field: 'Độ phân giải scan'),
            ),
          ],

          const SizedBox(height: 24),

          // Section 4: Mở rộng / Quy trình tráng & Định dạng file
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: colorScheme.outlineVariant),
            ),
            clipBehavior: Clip.antiAlias,
            child: ExpansionTile(
              initiallyExpanded: _isAdvancedExpanded,
              onExpansionChanged: (exp) =>
                  setState(() => _isAdvancedExpanded = exp),
              leading: Icon(
                Icons.tune_outlined,
                color: colorScheme.secondary,
              ),
              title: const Text(
                'Tùy chọn bổ sung (Hóa chất & Ghi chú)',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              subtitle: Text(
                'Hóa chất tráng, định dạng file JPEG/TIFF, ghi chú riêng...',
                style: TextStyle(
                  fontSize: 12,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              childrenPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 5,
                      child: CustomDropdownField<String>(
                        value: _selectedChemistry,
                        labelText: 'Hóa chất / Quy trình',
                        prefixIcon: const Icon(Icons.biotech_outlined),
                        items: _chemistries
                            .map((c) => DropdownItem(value: c, label: c))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedChemistry = val);
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 5,
                      child: CustomDropdownField<String>(
                        value: _selectedFormat,
                        labelText: 'Định dạng file',
                        prefixIcon: const Icon(Icons.image_outlined),
                        items: _formats
                            .map((f) => DropdownItem(value: f, label: f))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedFormat = val);
                          }
                        },
                      ),
                    ),
                  ],
                ),
                if (_selectedChemistry == 'Khác') ...[
                  const SizedBox(height: 12),
                  CustomInputField(
                    controller: _chemistryCustomController,
                    labelText: 'Quy trình tráng cụ thể',
                    hintText: 'Ví dụ: C-41, D-76, Rodinal, ECN-2...',
                    prefixIcon: const Icon(Icons.science_outlined),
                    validator: (v) => Validators.maxLength(
                      v,
                      50,
                      field: 'Hóa chất tráng',
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                CustomInputField(
                  controller: _notesController,
                  labelText: 'Ghi chú tráng scan',
                  hintText:
                      'Ví dụ: Push 1 stop, yêu cầu quét viền film, flat color...',
                  prefixIcon: const Icon(Icons.note_alt_outlined),
                  keyboardType: TextInputType.multiline,
                  maxLines: 2,
                  validator: (v) =>
                      Validators.maxLength(v, 500, field: 'Ghi chú'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Action Buttons
          CustomButton(
            label: widget.submitButtonLabel,
            height: 48,
            isLoading: widget.isLoading,
            icon: const Icon(Icons.check_circle_outline),
            onPressed: _handleSubmit,
          ),
          const SizedBox(height: 12),
          CustomButton(
            label: 'Đặt lại form',
            height: 44,
            isPrimary: false,
            icon: const Icon(Icons.refresh_outlined),
            onPressed: _handleReset,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    required ColorScheme colorScheme,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: colorScheme.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: colorScheme.primary,
            ),
          ),
        ),
      ],
    );
  }
}
