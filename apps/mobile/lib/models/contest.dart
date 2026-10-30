enum ContestStatus {
  draft('Bản nháp'),
  open('Mở nộp bài'),
  underReview('Chờ thẩm định'),
  judging('Đang chấm thi'),
  published('Đã công bố'),
  archived('Lưu trữ di sản'),
  cancelled('Đã hủy'),
  ongoing('Đang diễn ra'),
  completed('Đã kết thúc');

  const ContestStatus(this.label);

  final String label;

  static ContestStatus fromApi(String? value) {
    if (value == null) return ContestStatus.draft;
    final normalized = value.toLowerCase().replaceAll('-', '_');
    return switch (normalized) {
      'draft' => ContestStatus.draft,
      'open' => ContestStatus.open,
      'under_review' => ContestStatus.underReview,
      'judging' => ContestStatus.judging,
      'published' => ContestStatus.published,
      'archived' => ContestStatus.archived,
      'cancelled' => ContestStatus.cancelled,
      'ongoing' => ContestStatus.ongoing,
      'completed' => ContestStatus.completed,
      _ => ContestStatus.draft,
    };
  }
}

class Contest {
  const Contest({
    required this.id,
    required this.name,
    required this.status,
    this.description,
    this.startAt,
    this.endAt,
  });

  final String id;
  final String name;
  final String? description;
  final DateTime? startAt;
  final DateTime? endAt;
  final ContestStatus status;

  factory Contest.fromJson(Map<String, dynamic> json) {
    return Contest(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      startAt: _parseDate(json['start_at']),
      endAt: _parseDate(json['end_at']),
      status: ContestStatus.fromApi(json['status'] as String?),
    );
  }

  static DateTime? _parseDate(Object? value) {
    if (value is! String) return null;
    return DateTime.tryParse(value)?.toLocal();
  }
}

class ContestPage {
  const ContestPage({
    required this.items,
    required this.page,
    required this.totalPages,
  });

  final List<Contest> items;
  final int page;
  final int totalPages;

  bool get hasMore => page < totalPages;
}