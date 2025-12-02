# MCP Xiaozhi Web

Máy chủ web hỗ trợ chatbot Xiaozhi (ESP32-S3) với các tính năng:
- **Tin Thanh Niên**: Đọc tin tức từ các chuyên mục RSS của Thanh Niên
- **Google Custom Search Engine (CSE)**: Tìm kiếm Google qua API
- **WebSocket**: Hỗ trợ voice search và đọc bài viết cho chatbot

## Tính năng

### API Endpoints

| Endpoint | Mô tả |
|----------|-------|
| `GET /api/health` | Health check |
| `GET /api/news/categories` | Danh sách chuyên mục tin Thanh Niên |
| `GET /api/news?category=thoisu&limit=20` | Lấy tin theo chuyên mục |
| `GET /api/search/google?q=query&topK=5` | Tìm kiếm Google (cần cấu hình API key) |
| `GET /api/article/extract?url=...` | Trích xuất nội dung bài viết |

### WebSocket Commands (path: `/ws`)

| Type | Payload | Response |
|------|---------|----------|
| `hello` | `{ type: "hello", role: "esp32" }` | `{ type: "hello_ack", role }` |
| `search_google` | `{ type: "search_google", q: "query", topK: 5 }` | `{ type: "search_results", q, results }` |
| `read_result` | `{ type: "read_result", index: 0 }` | `{ type: "article_text" }` hoặc `{ type: "article_chunk" }` |
| `read_url` | `{ type: "read_url", url: "..." }` | `{ type: "article_text" }` hoặc `{ type: "article_chunk" }` |

## Cài đặt

```bash
npm install
```

## Chạy local

### Cách 1: Sử dụng biến môi trường
```bash
GOOGLE_CSE_API_KEY=your_api_key GOOGLE_CSE_CX=a3820d0d2ddab41a4 node server/server.js
```

### Cách 2: Sử dụng file .env (tùy chọn)
Tạo file `.env` (không commit vào repo):
```env
GOOGLE_CSE_API_KEY=your_api_key
GOOGLE_CSE_CX=a3820d0d2ddab41a4
```

Sau đó chạy với dotenv:
```bash
node --env-file=.env server/server.js
```

Hoặc cài đặt dotenv package:
```bash
npm install dotenv
```

Truy cập: http://localhost:3000

## Triển khai trên Render

1. Tạo **Web Service** mới từ repository này
2. Vào **Dashboard** → **Service** → **Environment**
3. Thêm các biến môi trường:
   - `GOOGLE_CSE_API_KEY`: API key Google của bạn
   - `GOOGLE_CSE_CX`: `a3820d0d2ddab41a4`
4. **Deploy** hoặc **Redeploy** để áp dụng

> ⚠️ **Bảo mật**: KHÔNG commit API key vào repository. Luôn sử dụng biến môi trường.

## Kiểm thử với ESP32

ESP32 gửi qua WebSocket:

```json
// Tìm kiếm
{"type":"search_google","q":"thời tiết Hà Nội hôm nay","topK":5}

// Đọc kết quả thứ 1
{"type":"read_result","index":0}

// Hoặc đọc URL trực tiếp
{"type":"read_url","url":"https://example.com/article"}
```

## Cấu trúc thư mục

```
├── public/
│   ├── index.html      # Giao diện web (Tin TN + Google CSE)
│   ├── styles.css      # CSS responsive 2 cột
│   └── app.js          # Frontend logic + WebSocket
├── server/
│   ├── server.js       # Express + WebSocket server
│   ├── config.js       # Cấu hình RSS endpoints
│   ├── rss.js          # RSS parser
│   ├── googleSearch.js # Google Custom Search API
│   └── extract.js      # Article content extraction
├── package.json
└── README.md
```

## Hạn mức

- Google Custom Search API: 100 queries/ngày (free tier)
- Theo dõi quota tại: https://console.cloud.google.com/apis/api/customsearch.googleapis.com

## License

MIT
