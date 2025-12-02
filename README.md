# MCP Xiaozhi Web

Đọc tin Thanh Niên qua RSS và nghe nhạc hợp pháp từ Zing MP3.

## Tính năng

- Đọc tin Thanh Niên theo chuyên mục qua RSS
- Nhúng playlist Zing MP3 chính thức (sử dụng official iframe embed)

## Cài đặt

```bash
npm install
```

## Chạy

```bash
npm start
```

Mở trình duyệt tại http://localhost:3000

## Cấu trúc

- `public/` - Giao diện web (HTML, CSS, JS)
- `server/` - Server Express xử lý RSS và API
- `public/zing-playlists.json` - Danh sách playlist Zing MP3 để nhúng

## Lưu ý

- Mục tin chỉ hiển thị tiêu đề, tóm tắt và liên kết gốc - không sao chép nội dung đầy đủ
- Phần nhạc chỉ sử dụng iframe embed chính thức từ Zing MP3
