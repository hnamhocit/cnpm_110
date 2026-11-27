class FrameLog {
  const FrameLog({
    required this.id,
    required this.rollId,
    required this.frameNumber,
    this.lensId,
    this.customLensName,
    this.focalLengthMm,
    this.aperture,
    this.shutterSpeed,
    this.exposureCompensation,
    this.filterUsed,
    this.locationName,
    this.notes,
  });

  final String id;
  final String rollId;
  final int frameNumber;
  final String? lensId;
  final String? customLensName;
  final int? focalLengthMm;
  final String? aperture;
  final String? shutterSpeed;
  final String? exposureCompensation;
  final String? filterUsed;
  final String? locationName;
  final String? notes;

  factory FrameLog.fromJson(Map<String, dynamic> json) {
    return FrameLog(
      id: (json['id'] ?? '').toString(),
      rollId: (json['rollId'] ?? json['roll_id'] ?? '').toString(),
      frameNumber: (json['frameNumber'] ?? json['frame_number'] ?? 1) as int,
      lensId: (json['lensId'] ?? json['lens_id'])?.toString(),
      customLensName:
          (json['customLensName'] ?? json['custom_lens_name'])?.toString(),
      focalLengthMm:
          (json['focalLengthMm'] ?? json['focal_length_mm']) as int?,
      aperture: json['aperture']?.toString(),
      shutterSpeed:
          (json['shutterSpeed'] ?? json['shutter_speed'])?.toString(),
      exposureCompensation: (json['exposureCompensation'] ??
              json['exposure_compensation'])
          ?.toString(),
      filterUsed: (json['filterUsed'] ?? json['filter_used'])?.toString(),
      locationName:
          (json['locationName'] ?? json['location_name'])?.toString(),
      notes: json['notes']?.toString(),
    );
  }
}

class FilmRoll {
  const FilmRoll({
    required this.id,
    required this.rollCode,
    this.filmStockId,
    this.customFilmName,
    required this.format,
    required this.isoRated,
    required this.isoShot,
    this.pushPullEv = '0 EV (Box Speed)',
    this.cameraId,
    this.customCameraName,
    this.labId,
    this.customLabName,
    required this.devProcess,
    required this.loadDate,
    this.devDate,
    required this.status,
    this.notes,
    this.loggedFramesCount = 0,
    this.maxFrames = 39,
    this.frames = const [],
  });

  final String id;
  final String rollCode;
  final String? filmStockId;
  final String? customFilmName;
  final String format;
  final int isoRated;
  final int isoShot;
  final String pushPullEv;
  final String? cameraId;
  final String? customCameraName;
  final String? labId;
  final String? customLabName;
  final String devProcess;
  final String loadDate;
  final String? devDate;
  final String status;
  final String? notes;
  final int loggedFramesCount;
  final int maxFrames;
  final List<FrameLog> frames;

  String get displayFilmName =>
      customFilmName ?? 'Cuộn phim ($rollCode)';

  factory FilmRoll.fromJson(Map<String, dynamic> json) {
    final framesRaw = json['frames'];
    return FilmRoll(
      id: (json['id'] ?? '').toString(),
      rollCode: (json['rollCode'] ?? json['roll_code'] ?? '').toString(),
      filmStockId: (json['filmStockId'] ?? json['film_stock_id'])?.toString(),
      customFilmName:
          (json['customFilmName'] ?? json['custom_film_name'])?.toString(),
      format: (json['format'] ?? '135').toString(),
      isoRated: (json['isoRated'] ?? json['iso_rated'] ?? 400) as int,
      isoShot: (json['isoShot'] ?? json['iso_shot'] ?? 400) as int,
      pushPullEv:
          (json['pushPullEv'] ?? '0 EV (Box Speed)').toString(),
      cameraId: (json['cameraId'] ?? json['camera_id'])?.toString(),
      customCameraName:
          (json['customCameraName'] ?? json['custom_camera_name'])?.toString(),
      labId: (json['labId'] ?? json['lab_id'])?.toString(),
      customLabName:
          (json['customLabName'] ?? json['custom_lab_name'])?.toString(),
      devProcess: (json['devProcess'] ?? json['dev_process'] ?? 'C-41').toString(),
      loadDate: (json['loadDate'] ?? json['load_date'] ?? '').toString(),
      devDate: (json['devDate'] ?? json['dev_date'])?.toString(),
      status: (json['status'] ?? 'SHOOTING').toString(),
      notes: json['notes']?.toString(),
      loggedFramesCount: (json['loggedFramesCount'] ?? 0) as int,
      maxFrames: (json['maxFrames'] ?? 39) as int,
      frames: framesRaw is List
          ? framesRaw
              .map((e) => FrameLog.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
    );
  }
}
