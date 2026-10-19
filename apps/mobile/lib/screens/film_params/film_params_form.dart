import 'package:flutter/material.dart';

import '../../core/components/custom_button.dart';
import '../../core/components/custom_dropdown_field.dart';
import '../../core/components/custom_input_field.dart';
import '../../core/utils/validators.dart';
import '../../models/film_shooting_params.dart';

class FilmParamsForm extends StatefulWidget {
  const FilmParamsForm({
    super.key,
    this.initialParams,
    required this.onSubmit,
    this.onReset,
    this.isLoading = false,
    this.submitButtonLabel = 'Lưu thông số phim',
  });

  final FilmShootingParams? initialParams;
  final ValueChanged<FilmShootingParams> onSubmit;
  final VoidCallback? onReset;
  final bool isLoading;
  final String submitButtonLabel;

  @override
  State<FilmParamsForm> createState() => _FilmParamsFormState();
}

class _FilmParamsFormState extends State<FilmParamsForm> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  late final TextEditingController _cameraBodyController;
  late final TextEditingController _lensController;
  late final TextEditingController _filmStockController;
  late final TextEditingController _filmBrandCustomController;
  late final TextEditingController _isoRatedController;
  late final TextEditingController _isoShotController;
  late final TextEditingController _frameNumberController;
  late final TextEditingController _rollIdController;
  late final TextEditingController _devLabNameController;
  late final TextEditingController _devChemistryController;
  late final TextEditingController _scannerModelController;
  late final TextEditingController _notesController;

  // Selections
  String _selectedBrand = 'Kodak';
  String _selectedFormat = '35mm';
  bool _matchRatedIso = true;
  bool _isAdvancedExpanded = false;

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
    '120',
    '4x5',
    '110',
    'Khác',
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
    final init = widget.initialParams;

    _cameraBodyController = TextEditingController(text: init?.cameraBody ?? '');
    _lensController = TextEditingController(text: init?.lens ?? '');
    _filmStockController = TextEditingController(text: init?.filmStock ?? '');
    _frameNumberController =
        TextEditingController(text: init?.frameNumber ?? '');
    _rollIdController = TextEditingController(text: init?.rollId ?? '');
    _devLabNameController = TextEditingController(text: init?.devLabName ?? '');
    _devChemistryController =
        TextEditingController(text: init?.devChemistry ?? '');
    _scannerModelController =
        TextEditingController(text: init?.scannerModel ?? '');
    _notesController = TextEditingController(text: init?.notes ?? '');

    final initialBrand = init?.filmBrand ?? 'Kodak';
    if (_popularBrands.contains(initialBrand)) {
      _selectedBrand = initialBrand;
      _filmBrandCustomController = TextEditingController();
    } else {
      _selectedBrand = 'Khác';
      _filmBrandCustomController = TextEditingController(text: initialBrand);
    }

    _selectedFormat = init?.filmFormat ?? '35mm';
    if (!_filmFormats.contains(_selectedFormat)) {
      _selectedFormat = '35mm';
    }

    final rated = init?.isoRated ?? 400;
    final shot = init?.isoShot ?? rated;
    _isoRatedController = TextEditingController(text: rated.toString());
    _isoShotController = TextEditingController(text: shot.toString());
    _matchRatedIso = rated == shot;
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
    _rollIdController.dispose();
    _devLabNameController.dispose();
    _devChemistryController.dispose();
    _scannerModelController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _onRatedIsoChanged(String value) {
    if (_matchRatedIso) {
      _isoShotController.text = value;
    }
  }

  void _selectQuickIso(int iso) {
    setState(() {
      _isoRatedController.text = iso.toString();
      if (_matchRatedIso) {
        _isoShotController.text = iso.toString();
      }
    });
  }

  void _handleSubmit() {
    if (!_formKey.currentState!.validate()) return;

    final finalBrand = _selectedBrand == 'Khác'
        ? _filmBrandCustomController.text.trim()
        : _selectedBrand;

    final rated = int.tryParse(_isoRatedController.text.trim()) ?? 400;
    final shot = _matchRatedIso
        ? rated
        : (int.tryParse(_isoShotController.text.trim()) ?? rated);

    final params = FilmShootingParams(
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
      devLabName: _devLabNameController.text.trim().isEmpty
          ? null
          : _devLabNameController.text.trim(),
      devChemistry: _devChemistryController.text.trim().isEmpty
          ? null
          : _devChemistryController.text.trim(),
      scannerModel: _scannerModelController.text.trim().isEmpty
          ? null
          : _scannerModelController.text.trim(),
      notes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
    );

    widget.onSubmit(params);
  }

  void _handleReset() {
    _formKey.currentState?.reset();
    _cameraBodyController.clear();
    _lensController.clear();
    _filmStockController.clear();
    _filmBrandCustomController.clear();
    _frameNumberController.clear();
    _rollIdController.clear();
    _devLabNameController.clear();
    _devChemistryController.clear();
    _scannerModelController.clear();
    _notesController.clear();

    setState(() {
      _selectedBrand = 'Kodak';
      _selectedFormat = '35mm';
      _matchRatedIso = true;
      _isoRatedController.text = '400';
      _isoShotController.text = '400';
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
          // Section 1: Thiết bị chụp (Camera & Lens)
          _buildSectionHeader(
            icon: Icons.camera_alt_outlined,
            title: 'Thiết bị chụp (Camera & Lens)',
            colorScheme: colorScheme,
          ),
          const SizedBox(height: 12),
          CustomInputField(
            controller: _cameraBodyController,
            labelText: 'Thân máy ảnh (Camera Body) *',
            hintText: 'Ví dụ: Canon AE-1, Nikon FM2, Leica M6',
            prefixIcon: const Icon(Icons.camera_alt_outlined),
            validator: (v) =>
                Validators.notEmpty(v, field: 'Thân máy ảnh') ??
                Validators.maxLength(v, 150, field: 'Thân máy ảnh'),
          ),
          const SizedBox(height: 12),
          CustomInputField(
            controller: _lensController,
            labelText: 'Ống kính (Lens)',
            hintText: 'Ví dụ: FD 50mm f/1.4, Nikkor 35mm f/2',
            prefixIcon: const Icon(Icons.lens_outlined),
            validator: (v) => Validators.maxLength(v, 150, field: 'Ống kính'),
          ),

          const SizedBox(height: 24),

          // Section 2: Thông tin cuộn phim (Film stock, Brand, Format)
          _buildSectionHeader(
            icon: Icons.movie_creation_outlined,
            title: 'Cuộn phim (Film Stock & Khổ phim)',
            colorScheme: colorScheme,
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: CustomDropdownField<String>(
                  value: _selectedBrand,
                  labelText: 'Hãng phim *',
                  prefixIcon: const Icon(Icons.business_outlined),
                  items: _popularBrands
                      .map(
                        (brand) => DropdownItem(value: brand, label: brand),
                      )
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedBrand = val);
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 5,
                child: CustomDropdownField<String>(
                  value: _selectedFormat,
                  labelText: 'Khổ phim *',
                  prefixIcon: const Icon(Icons.aspect_ratio_outlined),
                  items: _filmFormats
                      .map(
                        (fmt) => DropdownItem(value: fmt, label: fmt),
                      )
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

          if (_selectedBrand == 'Khác') ...[
            const SizedBox(height: 12),
            CustomInputField(
              controller: _filmBrandCustomController,
              labelText: 'Nhập tên hãng phim *',
              hintText: 'Ví dụ: Rollei, Shanghai, Arista',
              prefixIcon: const Icon(Icons.edit_note_outlined),
              validator: (v) =>
                  Validators.notEmpty(v, field: 'Hãng phim') ??
                  Validators.maxLength(v, 100, field: 'Hãng phim'),
            ),
          ],

          const SizedBox(height: 12),
          CustomInputField(
            controller: _filmStockController,
            labelText: 'Tên cuộn phim (Film Stock) *',
            hintText: 'Ví dụ: Portra 400, Gold 200, HP5 Plus, Cinestill 800T',
            prefixIcon: const Icon(Icons.style_outlined),
            validator: (v) =>
                Validators.notEmpty(v, field: 'Tên dòng phim') ??
                Validators.maxLength(v, 150, field: 'Tên dòng phim'),
          ),

          const SizedBox(height: 24),

          // Section 3: ISO & Frame
          _buildSectionHeader(
            icon: Icons.iso_outlined,
            title: 'Độ nhạy sáng (ISO) & Frame',
            colorScheme: colorScheme,
          ),
          const SizedBox(height: 12),

          // Quick ISO chips
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: _quickIsoList.map((iso) {
              final isSelected = _isoRatedController.text == iso.toString();
              return ChoiceChip(
                label: Text('ISO $iso'),
                selected: isSelected,
                onSelected: (_) => _selectQuickIso(iso),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: CustomInputField(
                  controller: _isoRatedController,
                  labelText: 'ISO hộp phim (Rated) *',
                  hintText: '400',
                  keyboardType: TextInputType.number,
                  prefixIcon: const Icon(Icons.numbers),
                  validator: (v) =>
                      Validators.positiveInteger(v, field: 'ISO hộp phim'),
                  onChanged: _onRatedIsoChanged,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: CustomInputField(
                  controller: _frameNumberController,
                  labelText: 'Số Frame (Frame #)',
                  hintText: 'Ví dụ: 12, 36A',
                  prefixIcon: const Icon(Icons.filter_frames_outlined),
                  validator: (v) =>
                      Validators.maxLength(v, 20, field: 'Số frame'),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Match rated ISO switch
          SwitchListTile(
            title: const Text('Chụp đúng ISO gốc hộp phim'),
            subtitle: Text(
              _matchRatedIso
                  ? 'ISO chụp = ISO hộp (${_isoRatedController.text.isEmpty ? "400" : _isoRatedController.text})'
                  : 'Push/Pull ISO (Chụp khác ISO gốc)',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            value: _matchRatedIso,
            onChanged: (val) {
              setState(() {
                _matchRatedIso = val;
                if (val) {
                  _isoShotController.text = _isoRatedController.text;
                }
              });
            },
            dense: true,
            contentPadding: EdgeInsets.zero,
          ),

          if (!_matchRatedIso) ...[
            const SizedBox(height: 8),
            CustomInputField(
              controller: _isoShotController,
              labelText: 'ISO khi bấm chụp (Shot ISO) *',
              hintText: 'Ví dụ: 800 (Push 1 stop), 200 (Pull 1 stop)',
              keyboardType: TextInputType.number,
              prefixIcon: const Icon(Icons.flash_on_outlined),
              validator: (v) =>
                  Validators.positiveInteger(v, field: 'ISO khi chụp'),
            ),
          ],

          const SizedBox(height: 16),

          // Section 4: Thông tin mở rộng (Tráng scan, Lab, Roll ID)
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
                Icons.science_outlined,
                color: colorScheme.secondary,
              ),
              title: const Text(
                'Thông tin tráng & scan (Mở rộng)',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              subtitle: Text(
                'Lab tráng, quy trình tráng, máy scan, mã cuộn...',
                style: TextStyle(
                  fontSize: 12,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              childrenPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              children: [
                CustomInputField(
                  controller: _rollIdController,
                  labelText: 'Mã cuộn (Roll ID)',
                  hintText: 'Ví dụ: ROLL-2026-001',
                  prefixIcon: const Icon(Icons.tag_outlined),
                  validator: (v) =>
                      Validators.maxLength(v, 100, field: 'Mã cuộn'),
                ),
                const SizedBox(height: 12),
                CustomInputField(
                  controller: _devLabNameController,
                  labelText: 'Lab tráng phim',
                  hintText: 'Ví dụ: Llab, Croplab, Nadar...',
                  prefixIcon: const Icon(Icons.storefront_outlined),
                  validator: (v) =>
                      Validators.maxLength(v, 150, field: 'Lab tráng'),
                ),
                const SizedBox(height: 12),
                CustomInputField(
                  controller: _devChemistryController,
                  labelText: 'Hóa chất / Quy trình tráng',
                  hintText: 'Ví dụ: C-41, D-76, ECN-2, Rodinal',
                  prefixIcon: const Icon(Icons.biotech_outlined),
                  validator: (v) => Validators.maxLength(
                    v,
                    50,
                    field: 'Hóa chất tráng',
                  ),
                ),
                const SizedBox(height: 12),
                CustomInputField(
                  controller: _scannerModelController,
                  labelText: 'Máy scan (Scanner Model)',
                  hintText: 'Ví dụ: Noritsu HS-1800, Fuji SP-3000',
                  prefixIcon: const Icon(Icons.scanner_outlined),
                  validator: (v) =>
                      Validators.maxLength(v, 150, field: 'Máy scan'),
                ),
                const SizedBox(height: 12),
                CustomInputField(
                  controller: _notesController,
                  labelText: 'Ghi chú thêm',
                  hintText: 'Ví dụ: Chụp lúc hoàng hôn, đo sáng qua app...',
                  prefixIcon: const Icon(Icons.note_alt_outlined),
                  keyboardType: TextInputType.multiline,
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
        Text(
          title,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: colorScheme.primary,
          ),
        ),
      ],
    );
  }
}
