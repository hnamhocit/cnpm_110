import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/components/contest_cached_image.dart';
import '../../core/providers/api_client_provider.dart';

/// Model tác phẩm trong Triển lãm số (Digital Archive - UC-43 / BR-17)
class ExhibitionItem {
  final String id;
  final String contestId;
  final String contestTitle;
  final String title;
  final String authorName;
  final String? webpUrl;
  final String? originalUrl;
  final String filmStock;
  final String cameraModel;
  final String filmFormat;
  final int year;
  final String? awardTitle;
  final String copyrightText;

  ExhibitionItem({
    required this.id,
    required this.contestId,
    required this.contestTitle,
    required this.title,
    required this.authorName,
    this.webpUrl,
    this.originalUrl,
    required this.filmStock,
    required this.cameraModel,
    required this.filmFormat,
    required this.year,
    this.awardTitle,
    required this.copyrightText,
  });

  factory ExhibitionItem.fromJson(Map<String, dynamic> json) {
    return ExhibitionItem(
      id: json['id'] as String? ?? '',
      contestId: json['contestId'] as String? ?? '',
      contestTitle: json['contestTitle'] as String? ?? 'Cuộc thi phim',
      title: json['title'] as String? ?? 'Tác phẩm triển lãm',
      authorName: json['authorName'] as String? ?? 'Nhiếp ảnh gia',
      webpUrl: json['webpUrl'] as String? ?? json['previewUrl'] as String?,
      originalUrl: json['originalUrl'] as String?,
      filmStock: json['filmStock'] as String? ?? 'Kodak Portra 400',
      cameraModel: json['cameraModel'] as String? ?? 'Leica M6',
      filmFormat: json['filmFormat'] as String? ?? '135 (35mm)',
      year: (json['year'] as num?)?.toInt() ?? 2026,
      awardTitle: json['awardTitle'] as String? ?? json['award'] as String?,
      copyrightText: json['copyrightText'] as String? ??
          '© 2026 CINEGEN Exhibition Archive (BR-17)',
    );
  }
}

/// Màn hình Triển lãm số Di sản ảnh phim (Digital Archive - UC-43)
class DigitalArchiveScreen extends ConsumerStatefulWidget {
  const DigitalArchiveScreen({super.key});

  @override
  ConsumerState<DigitalArchiveScreen> createState() =>
      _DigitalArchiveScreenState();
}

class _DigitalArchiveScreenState extends ConsumerState<DigitalArchiveScreen> {
  final _searchController = TextEditingController();
  String _selectedFilmStock = 'Tất cả';
  String _selectedCamera = 'Tất cả';
  int? _selectedYear;

  final List<String> _filmStockOptions = [
    'Tất cả',
    'Kodak Portra 400',
    'Kodak Tri-X 400',
    'Fujifilm Superia 400',
    'Ilford HP5 Plus',
  ];

  final List<String> _cameraOptions = [
    'Tất cả',
    'Leica M6',
    'Canon AE-1',
    'Olympus OM-1',
    'Hasselblad 500 C/M',
  ];

  final List<int?> _yearOptions = [null, 2026, 2025, 2024];

  bool _loading = false;
  List<ExhibitionItem> _items = [];

  @override
  void initState() {
    super.initState();
    _fetchArchiveItems();
  }

  Future<void> _fetchArchiveItems() async {
    setState(() => _loading = true);
    try {
      final dio = ref.read(apiClientProvider).dio;
      final queryParams = <String, dynamic>{
        'page': 1,
        'limit': 50,
      };
      if (_selectedFilmStock != 'Tất cả') {
        queryParams['filmStock'] = _selectedFilmStock;
      }
      if (_selectedCamera != 'Tất cả') {
        queryParams['camera'] = _selectedCamera;
      }
      if (_selectedYear != null) {
        queryParams['year'] = _selectedYear;
      }

      final response = await dio.get<Map<String, dynamic>>(
        '/api/v1/exhibitions',
        queryParameters: queryParams,
      );

      final raw = response.data?['data'];
      final list = raw is List
          ? raw
          : (raw is Map ? (raw['items'] as List? ?? []) : []);

      setState(() {
        _items = list
            .map((item) =>
                ExhibitionItem.fromJson(item as Map<String, dynamic>))
            .toList();
      });
    } catch (_) {
      // Fallback mock fixtures for exhibition showcase demo
      setState(() {
        _items = [
          ExhibitionItem(
            id: 'ex-01',
            contestId: 'c1',
            contestTitle: 'CINEGEN Annual Film Awards 2026',
            title: 'Sương sớm trên đồi chè Cầu Đất',
            authorName: 'Nguyễn Hoàng Sỹ Dương',
            webpUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
            filmStock: 'Kodak Portra 400',
            cameraModel: 'Leica M6',
            filmFormat: '135 (35mm)',
            year: 2026,
            awardTitle: 'Giải Nhất (Huy Chương Vàng)',
            copyrightText: '© 2026 CINEGEN Exhibition Archive (BR-17)',
          ),
          ExhibitionItem(
            id: 'ex-02',
            contestId: 'c1',
            contestTitle: 'CINEGEN Annual Film Awards 2026',
            title: 'Góc phố cổ Hà Nội sau cơn mưa',
            authorName: 'Trần Minh Đức',
            webpUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
            filmStock: 'Kodak Tri-X 400',
            cameraModel: 'Canon AE-1',
            filmFormat: '135 (35mm)',
            year: 2026,
            awardTitle: 'Giải Nhì (Huy Chương Bạc)',
            copyrightText: '© 2026 CINEGEN Exhibition Archive (BR-17)',
          ),
          ExhibitionItem(
            id: 'ex-03',
            contestId: 'c1',
            contestTitle: 'CINEGEN Annual Film Awards 2026',
            title: 'Hoàng hôn trên sông Hương',
            authorName: 'Lê Hoàng Nam',
            webpUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
            filmStock: 'Fujifilm Superia 400',
            cameraModel: 'Olympus OM-1',
            filmFormat: '135 (35mm)',
            year: 2026,
            awardTitle: 'Giải Ba (Huy Chương Đồng)',
            copyrightText: '© 2026 CINEGEN Exhibition Archive (BR-17)',
          ),
          ExhibitionItem(
            id: 'ex-04',
            contestId: 'c2',
            contestTitle: 'Khoảnh khắc Analog 2025',
            title: 'Bóng dáng người thợ thủ công',
            authorName: 'Võ Thanh Tùng',
            webpUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
            filmStock: 'Ilford HP5 Plus',
            cameraModel: 'Hasselblad 500 C/M',
            filmFormat: '120 (Medium Format)',
            year: 2025,
            awardTitle: 'Giải Tác Phẩm Ấn Tượng',
            copyrightText: '© 2025 CINEGEN Exhibition Archive (BR-17)',
          ),
        ];
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (sheetContext, setModalState) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Bộ lọc Triển lãm (UC-43)',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          setModalState(() {
                            _selectedFilmStock = 'Tất cả';
                            _selectedCamera = 'Tất cả';
                            _selectedYear = null;
                          });
                        },
                        child: const Text('Đặt lại'),
                      ),
                    ],
                  ),
                  const Divider(),
                  const SizedBox(height: 8),

                  // Film stock filter
                  const Text('Loại phim (Film Stock):',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: _filmStockOptions.map((stock) {
                      final isSelected = _selectedFilmStock == stock;
                      return ChoiceChip(
                        label: Text(stock),
                        selected: isSelected,
                        onSelected: (val) {
                          if (val) setModalState(() => _selectedFilmStock = stock);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  // Camera filter
                  const Text('Dòng máy ảnh (Camera):',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: _cameraOptions.map((cam) {
                      final isSelected = _selectedCamera == cam;
                      return ChoiceChip(
                        label: Text(cam),
                        selected: isSelected,
                        onSelected: (val) {
                          if (val) setModalState(() => _selectedCamera = cam);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  // Year filter
                  const Text('Năm tổ chức:',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: _yearOptions.map((yr) {
                      final isSelected = _selectedYear == yr;
                      return ChoiceChip(
                        label: Text(yr != null ? '$yr' : 'Tất cả năm'),
                        selected: isSelected,
                        onSelected: (val) {
                          if (val) setModalState(() => _selectedYear = yr);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  FilledButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      _fetchArchiveItems();
                    },
                    child: const Text('Áp dụng bộ lọc'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showDetailDialog(ExhibitionItem item) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        clipBehavior: Clip.antiAlias,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 4 / 3,
                    child: ContestCachedImage(
                      imageUrl: item.webpUrl ?? '',
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        item.copyrightText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (item.awardTitle != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade100,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          item.awardTitle!,
                          style: TextStyle(
                            color: Colors.amber.shade900,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    Text(
                      item.title,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Tác giả: ${item.authorName} • ${item.year}',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    ),
                    const Divider(height: 24),
                    _specRow('Cuộc thi', item.contestTitle),
                    _specRow('Loại phim', item.filmStock),
                    _specRow('Thân máy', item.cameraModel),
                    _specRow('Khổ phim', item.filmFormat),
                    _specRow('Bản quyền số', 'BR-17 Archive Watermarked'),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        child: const Text('Đóng'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Triển lãm số (Digital Archive)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            tooltip: 'Lọc tác phẩm',
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Tìm kiếm tác giả, phim, hoặc tiêu đề...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.tune_rounded),
                  onPressed: _showFilterSheet,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                    ? const Center(
                        child: Text('Không tìm thấy tác phẩm triển lãm nào.'),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(12),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          childAspectRatio: 0.72,
                        ),
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          return GestureDetector(
                            onTap: () => _showDetailDialog(item),
                            child: Card(
                              elevation: 2,
                              clipBehavior: Clip.antiAlias,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Expanded(
                                    child: Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        ContestCachedImage(
                                          imageUrl: item.webpUrl ?? '',
                                          fit: BoxFit.cover,
                                        ),
                                        Positioned(
                                          top: 6,
                                          right: 6,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 6,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.black54,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text(
                                              'BR-17',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 9,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(8),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${item.authorName} • ${item.filmStock}',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            color: Colors.grey.shade600,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
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
