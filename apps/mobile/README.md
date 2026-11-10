# 📱 Film Contest - Mobile Application

Ứng dụng di động đa nền tảng (Android, iOS) cho dự án Film Contest, được xây dựng bằng **[Flutter](https://flutter.dev/)**, sử dụng **[Riverpod](https://riverpod.dev/)** quản lý state và **[GoRouter](https://pub.dev/packages/go_router)** điều hướng.

Quy chuẩn nghiệp vụ sổ tay cuộn phim (Film Logbook) và chụp ảnh âm bản đối chứng tuân theo **[Master SRS](../../docs/srs.md)** và **[`docs/04-film-logbook.md`](../../docs/04-film-logbook.md)**.

---

## 📌 Công nghệ & Thư viện chính

- **SDK**: Flutter (Dart >= 3.13)
- **State Management**: [flutter_riverpod](https://pub.dev/packages/flutter_riverpod)
- **Routing**: [go_router](https://pub.dev/packages/go_router)
- **Bảo mật & Lưu trữ Token**: [flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage)
- **UI Design**: Material 3

---

## 🚀 Hướng dẫn khởi chạy

### 1. Yêu cầu hệ thống

- Đã cài đặt **Flutter SDK** (kiểm tra bằng `flutter doctor`).
- Thiết bị chạy thử nghiệm: Máy ảo Android Emulator, iOS Simulator, trình duyệt Chrome hoặc thiết bị thật kết nối qua USB (bật chế độ Developer).

### 2. Cài đặt dependencies

Di chuyển vào thư mục `apps/mobile/` và tải packages:

```bash
cd apps/mobile
flutter pub get
```

### 3. Chạy ứng dụng

Kiểm tra danh sách thiết bị có sẵn:

```bash
flutter devices
```

Khởi chạy ứng dụng:

```bash
# Chạy trên thiết bị mặc định
flutter run

# Hoặc chỉ định thiết bị cụ thể:
flutter run -d chrome
flutter run -d <device-id>
```

---

## 📜 Các lệnh kiểm tra & Testing

Các lệnh thực thi trong thư mục `apps/mobile`:

| Lệnh               | Ý nghĩa                                         |
| :----------------- | :---------------------------------------------- |
| `flutter pub get`  | Tải các thư viện trong `pubspec.yaml`           |
| `flutter analyze`  | Kiểm tra tĩnh mã nguồn Dart/Flutter             |
| `flutter test`     | Chạy toàn bộ Unit & Widget Tests                |
| `dart fix --apply` | Tự động sửa các cảnh báo cú pháp chuẩn của Dart |

---

## 📁 Cấu trúc thư mục

```text
apps/mobile/
├── lib/
│   ├── core/
│   │   ├── components/       # CustomButton, CustomInputField, LoadingDialog...
│   │   ├── network/          # AuthTokenStorage (lưu Access & Refresh token an toàn)
│   │   ├── providers/        # Riverpod State Providers (authProvider...)
│   │   └── utils/            # Validators, helpers
│   ├── router/
│   │   └── app_router.dart   # Định nghĩa GoRouter điều hướng các màn hình
│   ├── screens/              # Giao diện các màn hình
│   │   ├── auth/             # SplashScreen, LoginScreen, RegisterScreen
│   │   ├── home_screen.dart
│   │   ├── main_screen.dart  # BottomNavigationBar chính
│   │   ├── notifications_screen.dart
│   │   ├── profile_screen.dart
│   │   └── search_screen.dart
│   └── main.dart             # Entrypoint chính của Flutter (ProviderScope + MaterialApp.router)
├── test/                     # Widget tests & Component tests
├── pubspec.yaml              # Khai báo cấu hình và thư viện
└── analysis_options.yaml     # Bộ linter quy chuẩn Dart/Flutter
```
