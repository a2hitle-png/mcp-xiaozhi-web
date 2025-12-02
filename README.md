Máy chủ MCP đọc báo Thanh Niên qua RSS và mở nhạc từ Zing MP3.

## Tìm kiếm Google

Trang web sử dụng **Google Custom Search Engine (CSE) widget** để nhúng ô tìm kiếm.

- Widget CSE chỉ cần tham số `cx` (Search Engine ID), không yêu cầu API key.
- ID hiện tại: `cx=a3820d0d2ddab41a4`

### Tích hợp nâng cao (tùy chọn)

Nếu sau này cần sử dụng **Google Programmable Search JSON API** cho tìm kiếm server-side:

1. Tạo API key tại [Google Cloud Console](https://console.cloud.google.com/)
2. Đặt biến môi trường:
   ```bash
   GOOGLE_CSE_API_KEY=your_api_key_here
   GOOGLE_CSE_CX=a3820d0d2ddab41a4
   ```
3. **KHÔNG commit trực tiếp API key vào repository** – sử dụng biến môi trường hoặc secrets.
