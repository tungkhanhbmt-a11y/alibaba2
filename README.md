
# Next.js Bán Hàng với Google Sheets

## Mô tả
Ứng dụng web Next.js cho phép nhập đơn hàng, hiển thị danh sách đơn hàng, ghi và lấy dữ liệu từ Google Sheets.

## Tính năng
- Nhập đơn hàng mới
- Hiển thị danh sách đơn hàng từ Google Sheets
- Lưu đơn hàng mới lên Google Sheets

## Cấu hình Google API
1. Tạo Google Service Account và chia sẻ Google Sheet cho email service account.
2. Thêm file cấu hình khóa API vào thư mục `src/config/google-service-account.json`.
3. Sheet ID sử dụng: `1h13-Vk_2H4_0pR-VANHHKJh57Z9ngpvBq0xCXV7XcY4`

## Khởi động dự án
```bash
npm install
npm run dev
```

## Công nghệ sử dụng
- Next.js
- TypeScript
- Tailwind CSS
- Google Sheets API

## Thư mục chính
- `src/`: Chứa mã nguồn chính
- `src/app/`: Các trang Next.js
- `src/components/`: Các component giao diện
- `src/lib/`: Thư viện tích hợp Google Sheets
- `src/config/`: Chứa file cấu hình Google API

## Liên hệ
Vui lòng liên hệ admin để được cấp quyền truy cập Google Sheet hoặc hỗ trợ cấu hình API.
