class FilmDevScanParams {
  const FilmDevScanParams({
    required this.labName,
    required this.scannerModel,
    required this.scanResolution,
    this.devChemistry,
    this.scanFormat,
    this.devDate,
    this.notes,
  });

  /// Tên Lab tráng & scan (bắt buộc, max 150 ký tự)
  final String labName;

  /// Thiết bị scanner dùng để quét phim (bắt buộc, max 150 ký tự)
  final String scannerModel;

  /// Độ phân giải file scan (bắt buộc, max 100 ký tự, ví dụ: 2000x3000, 3000x4500, 3200 DPI)
  final String scanResolution;

  /// Quy trình / Hóa chất tráng (tuỳ chọn, ví dụ: C-41, B&W, E-6, ECN-2)
  final String? devChemistry;

  /// Định dạng file scan xuất ra (tuỳ chọn, ví dụ: JPEG, TIFF 8-bit, TIFF 16-bit)
  final String? scanFormat;

  /// Ngày thực hiện tráng scan (tuỳ chọn)
  final DateTime? devDate;

  /// Ghi chú thêm (tuỳ chọn, max 500 ký tự)
  final String? notes;

  FilmDevScanParams copyWith({
    String? labName,
    String? scannerModel,
    String? scanResolution,
    String? devChemistry,
    String? scanFormat,
    DateTime? devDate,
    String? notes,
  }) {
    return FilmDevScanParams(
      labName: labName ?? this.labName,
      scannerModel: scannerModel ?? this.scannerModel,
      scanResolution: scanResolution ?? this.scanResolution,
      devChemistry: devChemistry ?? this.devChemistry,
      scanFormat: scanFormat ?? this.scanFormat,
      devDate: devDate ?? this.devDate,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'labName': labName,
      'scannerModel': scannerModel,
      'scanResolution': scanResolution,
      if (devChemistry != null && devChemistry!.isNotEmpty)
        'devChemistry': devChemistry,
      if (scanFormat != null && scanFormat!.isNotEmpty)
        'scanFormat': scanFormat,
      if (devDate != null) 'devDate': devDate!.toIso8601String(),
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }

  factory FilmDevScanParams.fromMap(Map<String, dynamic> map) {
    return FilmDevScanParams(
      labName: map['labName'] as String? ?? map['devLabName'] as String? ?? '',
      scannerModel: map['scannerModel'] as String? ?? '',
      scanResolution: map['scanResolution'] as String? ?? '',
      devChemistry: map['devChemistry'] as String?,
      scanFormat: map['scanFormat'] as String?,
      devDate: map['devDate'] != null
          ? DateTime.tryParse(map['devDate'] as String)
          : null,
      notes: map['notes'] as String?,
    );
  }

  /// Chuẩn bị các trường dữ liệu gửi lên Backend API (kết hợp với multipart/form-data)
  Map<String, String> toApiFormDataFields() {
    final fields = <String, String>{
      'devLabName': labName.trim(),
      'scannerModel': scannerModel.trim(),
      'scanResolution': scanResolution.trim(),
    };

    if (devChemistry != null && devChemistry!.trim().isNotEmpty) {
      fields['devChemistry'] = devChemistry!.trim();
    }
    if (scanFormat != null && scanFormat!.trim().isNotEmpty) {
      fields['scanFormat'] = scanFormat!.trim();
    }
    if (notes != null && notes!.trim().isNotEmpty) {
      fields['devNotes'] = notes!.trim();
    }

    return fields;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FilmDevScanParams &&
          runtimeType == other.runtimeType &&
          labName == other.labName &&
          scannerModel == other.scannerModel &&
          scanResolution == other.scanResolution &&
          devChemistry == other.devChemistry &&
          scanFormat == other.scanFormat &&
          devDate == other.devDate &&
          notes == other.notes;

  @override
  int get hashCode => Object.hash(
        labName,
        scannerModel,
        scanResolution,
        devChemistry,
        scanFormat,
        devDate,
        notes,
      );
}
