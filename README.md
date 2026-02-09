# Google Flow Video Automation Tool 🎬

Công cụ Playwright để tự động đăng nhập vào Google Flow và tạo/tải video AI.

## 📋 Tính năng

- ✅ Tự động đăng nhập Google (hỗ trợ 2FA)
- ✅ Lưu phiên đăng nhập để không cần đăng nhập lại
- ✅ Tự động nhập prompt và tạo video
- ✅ Theo dõi tiến trình tạo video
- ✅ Tự động tải video xuống máy
- ✅ Chế độ tương tác (interactive mode)
- ✅ Hỗ trợ dòng lệnh (CLI)

## 🚀 Cài đặt

```bash
# Clone hoặc tải project
cd c:\Gemini\Veo3

# Cài đặt dependencies
npm install

# Cài đặt Chromium browser
npx playwright install chromium
```

## ⚙️ Cấu hình

1. Copy file `.env.example` thành `.env`:
```bash
copy .env.example .env
```

2. Chỉnh sửa file `.env` với thông tin tài khoản Google của bạn:
```env
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_PASSWORD=your-password
VIDEO_PROMPT=A beautiful sunset over the ocean
VIDEO_OUTPUT_DIR=./downloads
HEADLESS=false
SLOW_MO=100
```

## 📖 Cách sử dụng

### Chạy với prompt mặc định (từ .env)
```bash
node index.js
```

### Chạy với prompt tùy chỉnh
```bash
node index.js --prompt "A cinematic shot of a dragon flying over mountains"
```

### Chạy với tên file output tùy chỉnh
```bash
node index.js --prompt "Ocean waves" --output ocean-video.mp4
```

### Chế độ tương tác (mở browser để thao tác thủ công)
```bash
node index.js --interactive
```

### Xem hướng dẫn
```bash
node index.js --help
```

## 📁 Cấu trúc project

```
Veo3/
├── index.js              # Entry point - CLI
├── config.js             # Cấu hình (URLs, selectors, settings)
├── .env.example          # Template biến môi trường
├── .env                  # Biến môi trường (tạo từ .env.example)
├── package.json          # Dependencies
├── src/
│   ├── auth.js           # Xử lý đăng nhập Google
│   ├── video-generator.js # Tạo và tải video
│   └── flow-automation.js # Điều phối automation
├── downloads/            # Thư mục lưu video
└── user-data/            # Session browser (tự động tạo)
```

## ⚠️ Lưu ý quan trọng

### Bảo mật
- **KHÔNG** commit file `.env` lên git (đã thêm vào .gitignore)
- Sử dụng App Password nếu tài khoản bật 2FA
- Phiên đăng nhập được lưu trong thư mục `user-data/`

### Xác thực 2FA
Nếu tài khoản Google của bạn bật xác thực 2 bước:
1. Công cụ sẽ tự động phát hiện
2. Bạn cần nhập mã xác thực thủ công trong cửa sổ browser
3. Sau khi đăng nhập thành công, phiên sẽ được lưu lại

### Giới hạn và Quota
- Google Flow có giới hạn số video tạo mỗi ngày
- Cần có gói Google AI Pro hoặc Ultra để sử dụng đầy đủ tính năng
- Xem thêm tại: https://labs.google/fx/tools/flow/faq

### Selectors
- Giao diện Google Flow có thể thay đổi
- Nếu tool không hoạt động, có thể cần cập nhật selectors trong `config.js`

## 🔧 Xử lý sự cố

### Lỗi "Could not find prompt input field"
- Giao diện Flow có thể đã thay đổi
- Chạy `--interactive` mode và kiểm tra HTML elements
- Cập nhật selectors trong `config.js`

### Lỗi "Login failed"
- Kiểm tra lại email/password trong `.env`
- Nếu bật 2FA, cần nhập mã thủ công
- Thử xóa thư mục `user-data/` và đăng nhập lại

### Video không tải được
- Kiểm tra quota của tài khoản
- Đợi video generate xong hoàn toàn
- Kiểm tra kết nối internet

## 📝 Ví dụ Prompts

```bash
# Cảnh thiên nhiên
node index.js --prompt "A serene lake surrounded by autumn trees, golden leaves falling"

# Phong cách cinematic
node index.js --prompt "Cinematic drone shot of New York City at sunset, 4K quality"

# Animation
node index.js --prompt "A cute cartoon cat playing with a ball of yarn, Pixar style"

# Sci-fi
node index.js --prompt "A futuristic spaceship landing on Mars, sci-fi movie style"
```

## 📄 License

MIT License

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo Issue hoặc Pull Request.
