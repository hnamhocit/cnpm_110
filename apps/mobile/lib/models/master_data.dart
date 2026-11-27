class FilmStockItem {
  const FilmStockItem({
    required this.id,
    required this.code,
    required this.brand,
    required this.name,
    required this.nominalIso,
    required this.process,
    required this.supportedFormats,
  });

  final String id;
  final String code;
  final String brand;
  final String name;
  final int nominalIso;
  final String process;
  final List<String> supportedFormats;

  String get displayName => '$brand $name ($nominalIso)';

  factory FilmStockItem.fromJson(Map<String, dynamic> json) {
    final formatsRaw = json['supportedFormats'] ?? json['supported_formats'];
    return FilmStockItem(
      id: (json['id'] ?? '').toString(),
      code: (json['code'] ?? '').toString(),
      brand: (json['brand'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      nominalIso: (json['nominalIso'] ?? json['nominal_iso'] ?? 400) as int,
      process: (json['process'] ?? 'C-41').toString(),
      supportedFormats: formatsRaw is List
          ? formatsRaw.map((e) => e.toString()).toList()
          : const ['135'],
    );
  }
}

class CameraItem {
  const CameraItem({
    required this.id,
    required this.code,
    required this.brand,
    required this.model,
    required this.cameraType,
    required this.supportedFormat,
    this.defaultLensMount,
    this.hasFixedLens = false,
    this.fixedLensSpecs,
  });

  final String id;
  final String code;
  final String brand;
  final String model;
  final String cameraType;
  final String supportedFormat;
  final String? defaultLensMount;
  final bool hasFixedLens;
  final String? fixedLensSpecs;

  String get displayName => '$brand $model';

  factory CameraItem.fromJson(Map<String, dynamic> json) {
    return CameraItem(
      id: (json['id'] ?? '').toString(),
      code: (json['code'] ?? '').toString(),
      brand: (json['brand'] ?? '').toString(),
      model: (json['model'] ?? '').toString(),
      cameraType: (json['cameraType'] ?? json['camera_type'] ?? 'SLR').toString(),
      supportedFormat:
          (json['supportedFormat'] ?? json['supported_format'] ?? '135')
              .toString(),
      defaultLensMount:
          (json['defaultLensMount'] ?? json['default_lens_mount'])?.toString(),
      hasFixedLens:
          (json['hasFixedLens'] ?? json['has_fixed_lens'] ?? false) as bool,
      fixedLensSpecs:
          (json['fixedLensSpecs'] ?? json['fixed_lens_specs'])?.toString(),
    );
  }
}

class LensItem {
  const LensItem({
    required this.id,
    required this.code,
    required this.brand,
    required this.model,
    required this.mountType,
    required this.isPrime,
  });

  final String id;
  final String code;
  final String brand;
  final String model;
  final String mountType;
  final bool isPrime;

  String get displayName => '$brand $model';

  factory LensItem.fromJson(Map<String, dynamic> json) {
    return LensItem(
      id: (json['id'] ?? '').toString(),
      code: (json['code'] ?? '').toString(),
      brand: (json['brand'] ?? '').toString(),
      model: (json['model'] ?? '').toString(),
      mountType: (json['mountType'] ?? json['mount_type'] ?? '').toString(),
      isPrime: (json['isPrime'] ?? json['is_prime'] ?? true) as bool,
    );
  }
}

class FilmLabItem {
  const FilmLabItem({
    required this.id,
    required this.code,
    required this.name,
    required this.countryCode,
    required this.city,
    required this.supportedProcesses,
    required this.scanners,
    this.isVerifiedPartner = false,
  });

  final String id;
  final String code;
  final String name;
  final String countryCode;
  final String city;
  final List<String> supportedProcesses;
  final List<String> scanners;
  final bool isVerifiedPartner;

  String get displayName => '$name ($city)';

  factory FilmLabItem.fromJson(Map<String, dynamic> json) {
    final procRaw = json['supportedProcesses'] ?? json['supported_processes'];
    final scanRaw = json['scanners'];
    return FilmLabItem(
      id: (json['id'] ?? '').toString(),
      code: (json['code'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      countryCode:
          (json['countryCode'] ?? json['country_code'] ?? 'VN').toString(),
      city: (json['city'] ?? '').toString(),
      supportedProcesses: procRaw is List
          ? procRaw.map((e) => e.toString()).toList()
          : const ['C-41'],
      scanners: scanRaw is List
          ? scanRaw.map((e) => e.toString()).toList()
          : const ['NORITSU_HS1800'],
      isVerifiedPartner:
          (json['isVerifiedPartner'] ?? json['is_verified_partner'] ?? false)
              as bool,
    );
  }
}

class MasterDataCatalog {
  const MasterDataCatalog({
    this.filmStocks = const [],
    this.cameras = const [],
    this.lenses = const [],
    this.filmLabs = const [],
  });

  final List<FilmStockItem> filmStocks;
  final List<CameraItem> cameras;
  final List<LensItem> lenses;
  final List<FilmLabItem> filmLabs;
}
