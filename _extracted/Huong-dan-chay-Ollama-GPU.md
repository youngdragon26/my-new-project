# Hướng dẫn chạy chatbot bằng Ollama trên laptop (RTX 3050 4 GB)

## Cấu hình đang dùng

- `duc-minh-backend/.env`: `AI_PROVIDER=ollama`, `OLLAMA_MODEL=qwen3:1.7b`
- Biến môi trường Windows (User) cho Ollama: `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0`
- Model giữ trên máy:
  - `qwen3:1.7b` — đang dùng, 100% GPU, ~2 s/câu
  - `hf.co/unsloth/Qwen3-4B-Instruct-2507-GGUF:UD-Q3_K_XL` — dự phòng khi cần trả lời chi tiết, ~10 s/câu

## Thứ tự khởi động khi demo

1. Đóng bớt Chrome, Discord, IDE không dùng (máy 16 GB RAM dễ cạn bộ nhớ ảo).
2. Mở Ollama (hoặc thoát hẳn ở khay hệ thống rồi mở lại).
3. `cd D:\AI\duc-minh-backend` → `npm run dev`. Log phải có `Đã nạp sẵn mô hình Ollama (qwen3:1.7b).`
4. Kiểm tra: `ollama ps` → cột PROCESSOR là `100% GPU`.

## Cho trang web trên Render dùng Ollama của laptop

Cài 1 lần (chi tiết: README mục 6.6):
1. `winget install --id Cloudflare.cloudflared`, mở terminal mới.
2. `.env` laptop đã có sẵn `OLLAMA_API_KEY` (chuỗi bí mật) và `REMOTE_SERVER_URL`.
3. Render → Environment: `AI_PROVIDER=ollama`, `OLLAMA_MODEL=qwen3:1.7b`, `OLLAMA_API_KEY=<giống hệt .env>`.

Mỗi lần demo trên link `duc-minh-clinic.onrender.com`:
1. Mở Ollama → `cd D:\AI\duc-minh-backend` → `npm run tunnel`, để cửa sổ chạy.
2. Đợi dòng `Đã báo đường hầm lên https://duc-minh-clinic.onrender.com (server dùng Ollama (qwen3:1.7b))`.
3. Hỏi chatbot trên web — cửa sổ tunnel in `Web gọi Ollama → 200 (…s)` cho mỗi lượt.

Tắt laptop/script → sau ≤ 5 phút web tự dùng lại Gemini (có giới hạn 20 lượt/ngày).

Đã chạy thông ngày 29/10/2026: chatbot trên link Render trả lời bằng Ollama của laptop, 2,9–6,7 s/câu.

Lưu ý khi demo:
- Render vừa deploy lại (sau khi push code hoặc sửa Environment) → web tạm báo "đạt giới hạn miễn phí"
  khoảng ≤ 2 phút, tới khi script báo lại địa chỉ. Không cần làm gì, chỉ cần đợi.
- Mở `npm run tunnel` trước giờ demo vài phút, giữ cửa sổ đó mở suốt buổi.
- Terminal trong VS Code mà báo `ENOENT` với cloudflared: đã sửa (script tự tìm ở
  `C:\Program Files (x86)\cloudflared\`); nếu vẫn lỗi thì khởi động lại VS Code.

## Cải thiện độ chính xác chatbot với model nhỏ (29/10/2026)

Vấn đề: `qwen3:1.7b` gợi ý sai khoa ("đau họng" → Nhi khoa), hứa "mình sẽ kiểm tra lịch" mà không tra,
lặp câu xin xác nhận đặt lịch vô cớ. Nguyên nhân: prompt viết cho Gemini (~4.400 token, ~40 quy tắc) quá
sức model nhỏ.

Cách làm (không fine-tune):
- **Code tính sẵn dữ kiện** (`src/lib/chatAnalysis.js`): chuyên khoa theo từ khoá triệu chứng, dấu hiệu
  cấp cứu, câu hỏi lịch trống + ngày cụ thể ("tuần này", "thứ 7", "mai"…).
- **Prompt rút gọn** cho Ollama (`AI_COMPACT_PROMPT`, mặc định bật với Ollama): 8 quy tắc, dữ kiện để cuối.
- Câu hỏi lịch trống: trả lời thẳng từ CSDL, không qua model. Cấp cứu: code luôn chèn lời khuyên gọi 115.

Đo bằng `npm run eval-chat` (15 câu mẫu):

| Cấu hình | Kết quả | Thời gian TB |
|---|---|---|
| Prompt đầy đủ (trước) | 6/15 | 2,9 s |
| Prompt rút gọn + dữ kiện tính sẵn | 15/15 (2 lần chạy liên tiếp) | 1,3 s |

## Huấn luyện chatbot bằng câu mẫu + hỏi dò (29/10/2026)

Không fine-tune model; thay vào đó 5 vòng hỏi dò (~600 câu đa dạng: triệu chứng, quy trình, gõ không dấu/viết
tắt, câu cụt, ngoài phạm vi, tấn công prompt, chửi bậy, tiếng Anh, giá, hội thoại nhiều lượt). Mỗi vòng:
hỏi dò → đọc từng câu trả lời → sửa → thêm câu test → đo lại.

Các lỗi đáng chú ý đã sửa: tư vấn "bé sốt nên chườm đá", "không cần ngừng thuốc huyết áp", bỏ sót cấp cứu
(yếu nửa người, mang thai đau bụng từng cơn), trả lời "tự tử" lẫn tiếng Anh, lộ cách xử lý khi bị hỏi danh
sách số điện thoại bệnh nhân, bịa "không giảm giá cho sinh viên", bịa dịch vụ (Tết, wifi, tuyển dụng), mất
ngữ cảnh trẻ em qua nhiều lượt, "5/11" bị coi là phép chia, "đánh trống ngực" bị coi là hỏi lịch trống.

Kết quả: bộ test 111/111 sau 7 vòng + lỗi người dùng gặp trên web (~800 câu, có cả hội thoại 5–8 lượt, đo nhiều lần liên tiếp), trung bình 0,5 s/câu. Sau khi cập nhật code tunnel (vòng 6) cần tắt và chạy lại `npm run tunnel` để model giữ đúng ngữ cảnh 8192 (hết các lượt chậm 7–9 s). Kho câu mẫu: 64 câu, admin thêm tiếp ở
`/co-so-tri-thuc.html` khi gặp câu trả lời sai.

Câu mẫu giờ dùng embedding chạy trên Ollama (`qwen3-embedding:0.6b`, tải bằng `ollama pull qwen3-embedding:0.6b`,
~1 GB VRAM, nằm cùng GPU với `qwen3:1.7b`, mỗi lần nhúng ~20 ms) — không còn phụ thuộc hạn ngạch Gemini. Chỉ phần tìm
tài liệu MSD (RAG) còn dùng Gemini (1000 lượt/ngày); hết hạn ngạch thì chatbot vẫn chạy, chỉ không trích tài liệu.
Đổi model embedding thì chạy lại `node scripts/seed-chat-examples.js`.

## Kết quả so sánh (28/10/2026, 5 câu hỏi qua `/api/ai/chat`)

| Model | Nơi chạy | Trung bình / chậm nhất | Chất lượng |
|---|---|---|---|
| **`qwen3:1.7b`** | 100% GPU | **2,2 s / 3,2 s** | Đúng nhưng ngắn gọn, ít chi tiết |
| `Qwen3-4B-Instruct UD-Q3_K_XL` | 74% GPU | 10,4 s / 15,9 s | Gần bằng 4B gốc: chi tiết, trích nguồn |
| `qwen3:4b-instruct` (đã xoá) | 66% GPU | 16,7 s / 22,6 s | Tốt nhất nhưng chậm |
| `qwen2.5:3b` (đã xoá) | 100% GPU | 1,8 s / 2,8 s | Trả lời sai — loại |

Trên card 4 GB chỉ dòng ~1,7B đạt < 5 s/câu: Ollama dùng được ~2,8 GB VRAM, model 4B (kể cả nén Q3)
không vừa trọn; mà kể cả vừa thì 4B chỉ ~36 token/s, câu trả lời 300 token vẫn mất ~8 s.

## Xử lý sự cố

- **Chatbot chậm bất thường, Task Manager thấy GPU 0 (Intel) 100%, GPU 1 (NVIDIA) 0%:** Ollama mở lúc
  máy thiếu RAM nên không khởi tạo được CUDA, chạy nhầm card Intel. Đóng bớt ứng dụng, thoát Ollama, mở lại.
  Log `%LOCALAPPDATA%\Ollama\server.log` phải có dòng `inference compute ... library=CUDA`.
- **Không bật `OLLAMA_IGPU_ENABLE=1`:** Ollama không chia model ra 2 card mà dồn hết sang card Intel
  (dùng chung RAM, ~8 token/s) — chậm hơn nhiều.
- Muốn xem thời gian từng bước: chạy server với `AI_DEBUG=true`.
