# MCP Xiaozhi Web

Máy chủ MCP đọc báo Thanh Niên qua RSS và tìm kiếm Google (Google CSE).

## Tính năng

- **Tin Thanh Niên**: Đọc tin từ các chuyên mục của báo Thanh Niên qua RSS
- **Tìm kiếm Google (CSE)**: Tích hợp Google Custom Search Engine
- **WebSocket**: Hỗ trợ điều khiển tìm kiếm Google từ ESP32-S3 (xiaozhi) qua WebSocket

## Cài đặt

```bash
npm install
```

## Chạy server

```bash
npm start
# hoặc
npm run dev
```

Mở trình duyệt tại http://localhost:3000

## WebSocket API

Kết nối WebSocket tại `/ws`. Hỗ trợ lệnh:

### Tìm kiếm Google

```json
{
  "type": "search_google",
  "q": "từ khóa tìm kiếm"
}
```

## Cấu hình Google CSE

Để sử dụng tính năng tìm kiếm Google, bạn cần:

1. Tạo Custom Search Engine tại https://programmablesearchengine.google.com/
2. Lấy CX ID của search engine
3. Thay thế `YOUR_CX_ID` trong file `public/index.html` bằng CX ID thực

**Lưu ý bảo mật**: Không commit API key của Google. CSE widget chỉ cần CX ID (không phải API key).

## Ghi chú

- Tính năng phát nhạc (SoundCloud) đã được loại bỏ khỏi dự án
- Nếu sau này cần tích hợp nhạc, sẽ mở PR riêng
