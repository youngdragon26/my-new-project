# Lưu trữ dự án trên GitHub (cập nhật 02/11/2026)

- Repo duy nhất: https://github.com/youngdragon26/my-new-project (Public), gốc repo = `D:\AI`.
- Code web: thư mục `duc-minh-backend/`, giữ đủ lịch sử commit từ repo cũ `duc-minh-clinic`.
- Repo cũ `duc-minh-clinic` cần xoá thủ công: GitHub → repo → Settings → Danger Zone → Delete this repository.
- Bản sao `.git` cũ của `duc-minh-backend` đã được cất ra ngoài (thư mục tạm của Claude), không còn trong `D:\AI`.

## Không có trên GitHub (chỉ còn trên máy)

| Mục | Lý do |
|---|---|
| `duc-minh-backend/.env` | Chứa mật khẩu, khoá API — tự sao lưu riêng (USB, trình quản lý mật khẩu) |
| `Chuyên khoa/`, `_extracted/Khac/phòng khám/` | Cẩm nang MSD (có bản quyền), repo đang Public |
| `_extracted/Khac/AIO2025_Tutorial_RAG.pdf` | Tài liệu khoá học của bên thứ ba |
| `Git/`, `OllamaModels/`, `OllamaSetup.exe`, `node_modules/` | Phần mềm/thư viện tải lại được |

## Khôi phục trên máy khác

```
git clone https://github.com/youngdragon26/my-new-project.git AI
cd AI/duc-minh-backend
npm install
# tạo lại file .env theo .env.example
npm run dev
```

## Render

Service trên Render đang nối với repo cũ. Đổi sang `my-new-project` và đặt Root Directory = `duc-minh-backend`
(Render → service → Settings → Build & Deploy). Link web không đổi.
