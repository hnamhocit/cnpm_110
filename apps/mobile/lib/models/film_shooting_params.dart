class FilmShootingParams {
  const FilmShootingParams({
    required this.cameraBody,
    required this.filmStock,
    required this.filmBrand,
    required this.filmFormat,
    required this.isoRated,
    required this.isoShot,
    this.lens,
    this.frameNumber,
    this.rollId,
    this.devLabName,
    this.devChemistry,
    this.scannerModel,
    this.notes,
  });

  /// Thân máy ảnh (bắt buộc, max 150 ký tự)
  final String cameraBody;

  /// Ống kính (tuỳ chọn, max 150 ký tự)
  final String? lens;

  /// Tên dòng phim / film stock (bắt buộc, max 150 ký tự)
  final String filmStock;

  /// Hãng sản xuất phim (bắt buộc, max 100 ký tự)
  final String filmBrand;

  /// Khổ phim (bắt buộc, max 50 ký tự, ví dụ: 35mm, 120, 4x5)
  final String filmFormat;

  /// ISO danh định trên vỏ hộp phim (bắt buộc, số nguyên dương)
  final int isoRated;

  /// ISO thực tế khi chụp (bắt buộc, số nguyên dương)
  final int isoShot;

  /// Số thứ tự frame ảnh (tuỳ chọn, max 20 ký tự, ví dụ: "12", "00", "36A")
  final String? frameNumber;

  /// Mã nhận diện cuộn phim / Roll ID (tuỳ chọn, max 100 ký tự)
  final String? rollId;

  /// Tên Lab tráng phim (tuỳ chọn, max 150 ký tự)
  final String? devLabName;

  /// Hóa chất / Quy trình tráng (tuỳ chọn, max 50 ký tự, ví dụ: C-41, B&W, E-6)
  final String? devChemistry;

  /// Thiết bị scanner (tuỳ chọn, max 150 ký tự)
  final String? scannerModel;

  /// Ghi chú khác (tuỳ chọn)
  final String? notes;

  /// Kiểm tra xem thông số chụp có thực hiện push/pull ISO hay không
  bool get isPushedOrPulled => isoShot != isoRated;

  FilmShootingParams copyWith({
    String? cameraBody,
    String? lens,
    String? filmStock,
    String? filmBrand,
    String? filmFormat,
    int? isoRated,
    int? isoShot,
    String? frameNumber,
    String? rollId,
    String? devLabName,
    String? devChemistry,
    String? scannerModel,
    String? notes,
  }) {
    return FilmShootingParams(
      cameraBody: cameraBody ?? this.cameraBody,
      lens: lens ?? this.lens,
      filmStock: filmStock ?? this.filmStock,
      filmBrand: filmBrand ?? this.filmBrand,
      filmFormat: filmFormat ?? this.filmFormat,
      isoRated: isoRated ?? this.isoRated,
      isoShot: isoShot ?? this.isoShot,
      frameNumber: frameNumber ?? this.frameNumber,
      rollId: rollId ?? this.rollId,
      devLabName: devLabName ?? this.devLabName,
      devChemistry: devChemistry ?? this.devChemistry,
      scannerModel: scannerModel ?? this.scannerModel,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'cameraBody': cameraBody,
      if (lens != null && lens!.isNotEmpty) 'lens': lens,
      'filmStock': filmStock,
      'filmBrand': filmBrand,
      'filmFormat': filmFormat,
      'isoRated': isoRated,
      'isoShot': isoShot,
      if (frameNumber != null && frameNumber!.isNotEmpty)
        'frameNumber': frameNumber,
      if (rollId != null && rollId!.isNotEmpty) 'rollId': rollId,
      if (devLabName != null && devLabName!.isNotEmpty)
        'devLabName': devLabName,
      if (devChemistry != null && devChemistry!.isNotEmpty)
        'devChemistry': devChemistry,
      if (scannerModel != null && scannerModel!.isNotEmpty)
        'scannerModel': scannerModel,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }

  factory FilmShootingParams.fromMap(Map<String, dynamic> map) {
    return FilmShootingParams(
      cameraBody: map['cameraBody'] as String? ?? '',
      lens: map['lens'] as String?,
      filmStock: map['filmStock'] as String? ?? '',
      filmBrand: map['filmBrand'] as String? ?? '',
      filmFormat: map['filmFormat'] as String? ?? '35mm',
      isoRated: (map['isoRated'] as num?)?.toInt() ?? 400,
      isoShot: (map['isoShot'] as num?)?.toInt() ?? 400,
      frameNumber: map['frameNumber'] as String?,
      rollId: map['rollId'] as String?,
      devLabName: map['devLabName'] as String?,
      devChemistry: map['devChemistry'] as String?,
      scannerModel: map['scannerModel'] as String?,
      notes: map['notes'] as String?,
    );
  }

  /// Chuẩn bị các trường metadata đúng theo yêu cầu Backend API multipart/form-data
  Map<String, String> toApiFormDataFields() {
    final fields = <String, String>{
      'cameraBody': cameraBody.trim(),
      'filmBrand': filmBrand.trim(),
      'filmStock': filmStock.trim(),
      'filmFormat': filmFormat.trim(),
      'isoRated': isoRated.toString(),
      'isoShot': isoShot.toString(),
    };

    if (lens != null && lens!.trim().isNotEmpty) {
      fields['lens'] = lens!.trim();
    }
    if (frameNumber != null && frameNumber!.trim().isNotEmpty) {
      fields['frameNumber'] = frameNumber!.trim();
    }
    if (rollId != null && rollId!.trim().isNotEmpty) {
      fields['rollId'] = rollId!.trim();
    }
    if (devLabName != null && devLabName!.trim().isNotEmpty) {
      fields['devLabName'] = devLabName!.trim();
    }
    if (devChemistry != null && devChemistry!.trim().isNotEmpty) {
      fields['devChemistry'] = devChemistry!.trim();
    }
    if (scannerModel != null && scannerModel!.trim().isNotEmpty) {
      fields['scannerModel'] = scannerModel!.trim();
    }

    return fields;
  }
}
