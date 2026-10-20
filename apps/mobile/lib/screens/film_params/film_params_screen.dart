import 'package:flutter/material.dart';

import '../../models/film_shooting_params.dart';
import 'film_params_form.dart';

class FilmParamsScreen extends StatefulWidget {
  const FilmParamsScreen({
    super.key,
    this.initialParams,
    this.onSaved,
  });

  final FilmShootingParams? initialParams;
  final ValueChanged<FilmShootingParams>? onSaved;

  @override
  State<FilmParamsScreen> createState() => _FilmParamsScreenState();
}

class _FilmParamsScreenState extends State<FilmParamsScreen> {
  FilmShootingParams? _savedParams;

  void _onFormSubmitted(FilmShootingParams params) {
    setState(() => _savedParams = params);
    widget.onSaved?.call(params);

    _showSummaryDialog(params);
  }

  void _showSummaryDialog(FilmShootingParams params) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return DraggableScrollableSheet(
          initialChildSize: 0.65,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (_, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
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
                      Icon(
                        Icons.check_circle,
                        color: colorScheme.primary,
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Thông số phim đã nhập',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  _buildSummaryItem(
                    icon: Icons.camera_alt_outlined,
                    label: 'Thân máy ảnh (Camera Body)',
                    value: params.cameraBody,
                  ),
                  if (params.lens != null && params.lens!.isNotEmpty)
                    _buildSummaryItem(
                      icon: Icons.lens_outlined,
                      label: 'Ống kính (Lens)',
                      value: params.lens!,
                    ),
                  _buildSummaryItem(
                    icon: Icons.movie_creation_outlined,
                    label: 'Cuộn phim (Film Stock)',
                    value: '${params.filmBrand} ${params.filmStock}',
                  ),
                  _buildSummaryItem(
                    icon: Icons.aspect_ratio_outlined,
                    label: 'Khổ phim (Format)',
                    value: params.filmFormat,
                  ),
                  _buildSummaryItem(
                    icon: Icons.iso_outlined,
                    label: 'Độ nhạy sáng (ISO)',
                    value: params.isPushedOrPulled
                        ? 'ISO Rated: ${params.isoRated} → ISO Shot: ${params.isoShot} (${params.isoShot > params.isoRated ? "Push" : "Pull"})'
                        : 'ISO ${params.isoRated} (Gốc)',
                  ),
                  if (params.frameNumber != null &&
                      params.frameNumber!.isNotEmpty)
                    _buildSummaryItem(
                      icon: Icons.filter_frames_outlined,
                      label: 'Số Frame (Frame #)',
                      value: params.frameNumber!,
                    ),
                  if (params.rollId != null && params.rollId!.isNotEmpty)
                    _buildSummaryItem(
                      icon: Icons.tag_outlined,
                      label: 'Mã cuộn (Roll ID)',
                      value: params.rollId!,
                    ),
                  if (params.devLabName != null &&
                      params.devLabName!.isNotEmpty)
                    _buildSummaryItem(
                      icon: Icons.storefront_outlined,
                      label: 'Lab tráng',
                      value: params.devLabName!,
                    ),
                  if (params.devChemistry != null &&
                      params.devChemistry!.isNotEmpty)
                    _buildSummaryItem(
                      icon: Icons.biotech_outlined,
                      label: 'Quy trình / Hoá chất',
                      value: params.devChemistry!,
                    ),
                  if (params.scannerModel != null &&
                      params.scannerModel!.isNotEmpty)
                    _buildSummaryItem(
                      icon: Icons.scanner_outlined,
                      label: 'Máy scan',
                      value: params.scannerModel!,
                    ),
                  if (params.notes != null && params.notes!.isNotEmpty)
                    _buildSummaryItem(
                      icon: Icons.note_alt_outlined,
                      label: 'Ghi chú',
                      value: params.notes!,
                    ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () {
                      Navigator.of(sheetContext).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Đã lưu thông số chụp phim thành công!'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    child: const Text('Xác nhận & Hoàn tất'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSummaryItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: colorScheme.secondary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông số chụp phim'),
        centerTitle: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 540),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_savedParams != null) ...[
                  Card(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Icon(
                            Icons.check_circle,
                            color: Theme.of(context)
                                .colorScheme
                                .onPrimaryContainer,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Đã lưu thông số: ${_savedParams!.cameraBody} | ${_savedParams!.filmBrand} ${_savedParams!.filmStock}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context)
                                    .colorScheme
                                    .onPrimaryContainer,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                FilmParamsForm(
                  initialParams: widget.initialParams,
                  onSubmit: _onFormSubmitted,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
