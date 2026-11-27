import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers/film_logbook_provider.dart';
import '../../core/providers/master_data_provider.dart';
import '../../models/film_logbook.dart';
import '../../models/master_data.dart';

class FilmLogbookScreen extends ConsumerWidget {
  const FilmLogbookScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rollsAsync = ref.watch(myFilmRollsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sổ tay cuộn phim (Logbook)'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateRollSheet(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Thêm cuộn phim'),
      ),
      body: rollsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline, size: 40, color: colorScheme.error),
                const SizedBox(height: 12),
                Text(err.toString(), textAlign: TextAlign.center),
                const SizedBox(height: 12),
                FilledButton.tonal(
                  onPressed: () => ref.invalidate(myFilmRollsProvider),
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
        data: (rolls) {
          if (rolls.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.camera_roll_outlined,
                      size: 56,
                      color: colorScheme.outline,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Chưa có cuộn phim nào trong sổ tay.\nNhấn "Thêm cuộn phim" để bắt đầu ghi nhật ký.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(myFilmRollsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 88),
              itemCount: rolls.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final roll = rolls[index];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: colorScheme.primaryContainer,
                      child: Icon(
                        Icons.camera_roll,
                        color: colorScheme.onPrimaryContainer,
                      ),
                    ),
                    title: Text(
                      roll.displayFilmName,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      '${roll.rollCode} · ${roll.format} · ISO ${roll.isoShot} · ${roll.loggedFramesCount}/${roll.maxFrames} frames',
                    ),
                    trailing: Chip(
                      label: Text(
                        roll.status,
                        style: const TextStyle(fontSize: 11),
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => FilmRollDetailScreen(rollId: roll.id),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _showCreateRollSheet(BuildContext context, WidgetRef ref) async {
    final catalog =
        await ref.read(masterDataCatalogProvider.future).catchError((_) {
      return const MasterDataCatalog();
    });
    if (!context.mounted) return;

    final customFilmCtrl = TextEditingController();
    final customCamCtrl = TextEditingController();
    final isoCtrl = TextEditingController(text: '400');
    String selectedFormat = '135';
    String selectedProcess = 'C-41';
    FilmStockItem? selectedStock;
    CameraItem? selectedCam;
    FilmLabItem? selectedLab;
    bool saving = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetCtx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                20,
                20,
                20,
                MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Tạo cuộn phim mới',
                      style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    if (catalog.filmStocks.isNotEmpty)
                      DropdownButtonFormField<FilmStockItem>(
                        decoration: const InputDecoration(
                          labelText: 'Chọn Film Stock (Danh mục M02)',
                          border: OutlineInputBorder(),
                        ),
                        items: catalog.filmStocks
                            .map(
                              (s) => DropdownMenuItem(
                                value: s,
                                child: Text(s.displayName),
                              ),
                            )
                            .toList(),
                        onChanged: (val) {
                          setSheetState(() {
                            selectedStock = val;
                            if (val != null) {
                              customFilmCtrl.text = '${val.brand} ${val.name}';
                              isoCtrl.text = '${val.nominalIso}';
                              selectedProcess = val.process;
                            }
                          });
                        },
                      ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: customFilmCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Tên phim (hoặc nhập tay) *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: selectedFormat,
                            decoration: const InputDecoration(
                              labelText: 'Khổ phim',
                              border: OutlineInputBorder(),
                            ),
                            items: const [
                              DropdownMenuItem(value: '135', child: Text('135')),
                              DropdownMenuItem(
                                value: '120_645',
                                child: Text('120 (6x4.5)'),
                              ),
                              DropdownMenuItem(
                                value: '120_66',
                                child: Text('120 (6x6)'),
                              ),
                              DropdownMenuItem(
                                value: '120_67',
                                child: Text('120 (6x7)'),
                              ),
                              DropdownMenuItem(value: '4x5', child: Text('4x5')),
                            ],
                            onChanged: (v) {
                              if (v != null) {
                                setSheetState(() => selectedFormat = v);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: isoCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'ISO *',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    if (catalog.cameras.isNotEmpty) ...[
                      DropdownButtonFormField<CameraItem>(
                        decoration: const InputDecoration(
                          labelText: 'Máy ảnh (Danh mục M02)',
                          border: OutlineInputBorder(),
                        ),
                        items: catalog.cameras
                            .map(
                              (c) => DropdownMenuItem(
                                value: c,
                                child: Text(c.displayName),
                              ),
                            )
                            .toList(),
                        onChanged: (val) {
                          setSheetState(() {
                            selectedCam = val;
                            if (val != null) customCamCtrl.text = val.displayName;
                          });
                        },
                      ),
                      const SizedBox(height: 10),
                    ],
                    TextField(
                      controller: customCamCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Tên máy ảnh (tuỳ chọn)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    if (catalog.filmLabs.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      DropdownButtonFormField<FilmLabItem>(
                        decoration: const InputDecoration(
                          labelText: 'Phòng Lab (Danh mục M02)',
                          border: OutlineInputBorder(),
                        ),
                        items: catalog.filmLabs
                            .map(
                              (l) => DropdownMenuItem(
                                value: l,
                                child: Text(l.displayName),
                              ),
                            )
                            .toList(),
                        onChanged: (val) => setSheetState(() => selectedLab = val),
                      ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: saving
                          ? null
                          : () async {
                              final iso = int.tryParse(isoCtrl.text.trim()) ?? 400;
                              if (selectedStock == null &&
                                  customFilmCtrl.text.trim().isEmpty) {
                                return;
                              }
                              setSheetState(() => saving = true);
                              try {
                                final today =
                                    DateTime.now().toIso8601String().split('T').first;
                                await ref
                                    .read(filmLogbookRepositoryProvider)
                                    .createRoll({
                                  if (selectedStock != null)
                                    'filmStockId': selectedStock!.id,
                                  if (customFilmCtrl.text.trim().isNotEmpty)
                                    'customFilmName': customFilmCtrl.text.trim(),
                                  'format': selectedFormat,
                                  'isoRated': iso,
                                  'isoShot': iso,
                                  if (selectedCam != null)
                                    'cameraId': selectedCam!.id,
                                  if (customCamCtrl.text.trim().isNotEmpty)
                                    'customCameraName': customCamCtrl.text.trim(),
                                  if (selectedLab != null)
                                    'labId': selectedLab!.id,
                                  'devProcess': selectedProcess,
                                  'loadDate': today,
                                });
                                ref.invalidate(myFilmRollsProvider);
                                if (ctx.mounted) Navigator.of(ctx).pop();
                              } on ApiException catch (e) {
                                if (ctx.mounted) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(content: Text(e.message)),
                                  );
                                }
                              } finally {
                                if (ctx.mounted) setSheetState(() => saving = false);
                              }
                            },
                      child: saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Lưu cuộn phim'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class FilmRollDetailScreen extends ConsumerWidget {
  const FilmRollDetailScreen({super.key, required this.rollId});

  final String rollId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(filmRollDetailProvider(rollId));

    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết cuộn phim')),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text(err.toString())),
        data: (roll) {
          return Column(
            children: [
              Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${roll.displayFilmName} (${roll.rollCode})',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Khổ: ${roll.format} · ISO: ${roll.isoRated}/${roll.isoShot} (${roll.pushPullEv})',
                      ),
                      Text(
                        'Trạng thái: ${roll.status} · Đã ghi: ${roll.loggedFramesCount}/${roll.maxFrames} frames',
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Danh sách khung hình (Frames)',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    if (roll.status == 'SHOOTING')
                      FilledButton.tonalIcon(
                        onPressed: () => _showAddFrameDialog(context, ref, roll),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Ghi Frame'),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: roll.frames.isEmpty
                    ? const Center(child: Text('Chưa ghi khung hình nào.'))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: roll.frames.length,
                        itemBuilder: (_, idx) {
                          final f = roll.frames[idx];
                          return Card(
                            child: ListTile(
                              leading: CircleAvatar(
                                child: Text('#${f.frameNumber}'),
                              ),
                              title: Text(
                                [
                                  f.aperture,
                                  f.shutterSpeed,
                                  f.locationName,
                                ].where((e) => e != null && e.isNotEmpty).join(' · ').isEmpty
                                    ? 'Khung hình #${f.frameNumber}'
                                    : [
                                        f.aperture,
                                        f.shutterSpeed,
                                        f.locationName,
                                      ].where((e) => e != null && e.isNotEmpty).join(' · '),
                              ),
                              subtitle: f.notes != null ? Text(f.notes!) : null,
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline),
                                onPressed: () async {
                                  await ref
                                      .read(filmLogbookRepositoryProvider)
                                      .deleteFrame(roll.id, f.id);
                                  ref.invalidate(filmRollDetailProvider(rollId));
                                  ref.invalidate(myFilmRollsProvider);
                                },
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _showAddFrameDialog(
    BuildContext context,
    WidgetRef ref,
    FilmRoll roll,
  ) async {
    final frameCtrl = TextEditingController(
      text: '${roll.loggedFramesCount + 1}',
    );
    final apertureCtrl = TextEditingController();
    final shutterCtrl = TextEditingController();
    final locationCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (dlgCtx) => AlertDialog(
        title: Text('Ghi Frame (Tối đa ${roll.maxFrames})'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: frameCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Số frame *'),
              ),
              TextField(
                controller: apertureCtrl,
                decoration: const InputDecoration(labelText: 'Khẩu độ (vd: f/2.8)'),
              ),
              TextField(
                controller: shutterCtrl,
                decoration: const InputDecoration(labelText: 'Tốc độ (vd: 1/250s)'),
              ),
              TextField(
                controller: locationCtrl,
                decoration: const InputDecoration(labelText: 'Địa điểm chụp'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dlgCtx).pop(),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () async {
              final num = int.tryParse(frameCtrl.text.trim());
              if (num == null || num <= 0 || num > roll.maxFrames) {
                ScaffoldMessenger.of(dlgCtx).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Số frame phải từ 1 đến ${roll.maxFrames} cho khổ ${roll.format} (BR-23).',
                    ),
                  ),
                );
                return;
              }
              try {
                await ref.read(filmLogbookRepositoryProvider).addFrame(roll.id, {
                  'frameNumber': num,
                  if (apertureCtrl.text.trim().isNotEmpty)
                    'aperture': apertureCtrl.text.trim(),
                  if (shutterCtrl.text.trim().isNotEmpty)
                    'shutterSpeed': shutterCtrl.text.trim(),
                  if (locationCtrl.text.trim().isNotEmpty)
                    'locationName': locationCtrl.text.trim(),
                });
                ref.invalidate(filmRollDetailProvider(rollId));
                ref.invalidate(myFilmRollsProvider);
                if (dlgCtx.mounted) Navigator.of(dlgCtx).pop();
              } on ApiException catch (e) {
                if (dlgCtx.mounted) {
                  ScaffoldMessenger.of(dlgCtx).showSnackBar(
                    SnackBar(content: Text(e.message)),
                  );
                }
              }
            },
            child: const Text('Lưu Frame'),
          ),
        ],
      ),
    );
  }
}
