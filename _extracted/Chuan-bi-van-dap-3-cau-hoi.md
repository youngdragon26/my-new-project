# Chuẩn bị vấn đáp — Ứng dụng Trí tuệ nhân tạo (Nhóm 03 — Đa khoa Đức Minh)

Tài liệu soạn theo 3 dạng câu hỏi hay gặp. Mọi chi tiết đều lấy từ code hiện tại trong `duc-minh-backend`
(đường dẫn file ghi trong ngoặc để mở ra chỉ khi thầy/cô hỏi sâu).

---

## Câu 1. Hệ thống này các em phân tích thế nào?

**Nói ngắn (30 giây):** Bài toán là phòng khám đa khoa tư nhân cần một website vừa giới thiệu, vừa quản lý
khám chữa bệnh, có trợ lý AI trả lời bệnh nhân 24/7. Nhóm phân tích theo hướng hướng đối tượng/UML:
xác định tác nhân → use case → CSDL → kiến trúc → chỗ nào dùng AI.

**1. Tác nhân (4 vai trò, phân quyền RBAC):**
- Bệnh nhân: đăng ký/đăng nhập, đặt lịch, xem hồ sơ khám, đơn thuốc, hoá đơn, thanh toán QR, chat với AI.
- Bác sĩ: xem hàng đợi, khám bệnh, ghi chẩn đoán, kê đơn (có cảnh báo tương tác thuốc), tóm tắt AI bệnh sử.
- Nhân viên: quản lý hàng đợi, lập hoá đơn, xác nhận thu tiền.
- Quản trị viên: quản lý tài khoản (cấp quyền, khoá), danh mục thuốc, giá khám, lịch trực bác sĩ,
  thống kê/xuất Excel, dạy chatbot (câu trả lời mẫu), xem nhật ký hoạt động.
- Khách vãng lai (chưa đăng nhập): chỉ xem trang chủ và hỏi chatbot.

**2. Các nhóm chức năng (use case chính):** Xác thực (có sẵn OTP 2FA qua email, bật bằng `REQUIRE_OTP`) —
Đặt lịch (theo chuyên khoa, bác sĩ, ca trực; không cho đặt quá số bác sĩ rảnh) — Khám bệnh & kê đơn —
Hoá đơn & thanh toán VietQR — Lịch trực — Thống kê, báo cáo — Chatbot AI và trợ lý trong Không gian làm việc.

**3. Kiến trúc:** Client–Server 3 lớp.
- Giao diện: HTML/CSS/JS thuần trong `public/`, phục vụ chung với backend → 1 link duy nhất.
- Backend: Node.js + Express, chia `routes/` (auth, appointments, clinical, billing, schedule, stats, ai…),
  `middleware/` (xác thực JWT, phân quyền), `lib/` (nghiệp vụ, AI).
- CSDL: PostgreSQL trên Neon, có extension **pgvector** để lưu vector cho RAG.
- Triển khai: Render (file `render.yaml`), bí mật để ở biến môi trường, `.env` không đưa lên GitHub.

**4. Phân tích chỗ cần AI** (điểm nên nhấn mạnh — không phải chỗ nào cũng dùng AI):
- Câu hỏi có đáp án chắc chắn (giá, giờ, lịch trống, cấp cứu) → lấy từ CSDL / luật, **không** để model tự nói.
- Câu hỏi tự nhiên, đa dạng cách diễn đạt (triệu chứng → khoa nào, hỏi tiếp nối) → dùng LLM + RAG.
- Bác sĩ cần đọc nhanh bệnh sử dài → dùng LLM tóm tắt, chỉ trên dữ liệu đã lưu.
- Yêu cầu phi chức năng: bảo mật dữ liệu y tế (JWT, RBAC, ghi nhật ký), không bịa thông tin y khoa,
  chạy được ở gói miễn phí.

---

## Câu 2. Các em dùng prompt / kỹ thuật Prompt Engineering như thế nào?

Các kỹ thuật đã áp dụng (đều nằm trong `src/routes/ai.js`):

| Kỹ thuật | Cách làm trong hệ thống |
|---|---|
| **Role prompting** (gán vai) | "Bạn là trợ lý ảo của Phòng khám Đa khoa Đức Minh…", quy định xưng "mình", gọi "bạn", trả lời 2–4 câu. |
| **Context injection / Grounding** | Mỗi lượt chèn vào prompt: ngày hôm nay, thông tin phòng khám lấy **trực tiếp từ CSDL** (giá, bác sĩ theo khoa, giờ làm), trạng thái đăng nhập, tài liệu RAG. |
| **Ràng buộc rõ ràng (constraints)** | Danh sách quy tắc đánh số: chỉ dùng dữ kiện có trong prompt, không bịa giá/bác sĩ/thuốc, không chẩn đoán thay bác sĩ, thuốc/liều chỉ khi có trong tài liệu và phải ghi "(Nguồn: …)", ngoài phạm vi thì từ chối 1 câu. |
| **Few-shot prompting** | Bảng `chat_examples`: admin tự soạn câu hỏi–trả lời mẫu ở `/co-so-tri-thuc.html`. Mỗi lượt tìm câu mẫu gần nhất (vector + so khớp trigram) đưa vào prompt "bắt chước nội dung và cách trả lời"; gần như trùng (≥ 0,85) thì trả nguyên văn. |
| **Pre-computed facts** (dữ kiện tính sẵn) | Code phân tích tin nhắn trước (`src/lib/chatAnalysis.js`): chuyên khoa theo triệu chứng, ngày/giờ hợp lệ, số điện thoại đủ số chưa, cấp cứu… rồi đưa vào khối "KẾT QUẢ KIỂM TRA TỰ ĐỘNG — đúng tuyệt đối, không tự tính lại". Model chỉ diễn đạt lại → tránh model nhỏ tính sai ngày. |
| **Structured output (JSON schema)** | Bước mở rộng câu hỏi bắt model trả JSON `{queries[], hypotheticalAnswer}` theo schema. |
| **Function calling / Tool use** | Model được khai báo công cụ `check_available_slots`, `book_appointment`, `my_appointments`, `my_records`, `my_invoices`, `my_followups`; quy tắc "chỉ gọi `book_appointment` sau khi khách xác nhận", "không bao giờ nói đã đặt nếu chưa gọi công cụ". Công cụ dữ liệu cá nhân bị khoá theo `req.user.id`. |
| **Nhiệt độ thấp** | `temperature: 0.3` để bám tài liệu, ít sáng tạo. |
| **Prompt theo năng lực model** | 2 bản prompt: **đầy đủ** (~40 quy tắc) cho Gemini; **rút gọn** (13 quy tắc) cho model local 1,7B. Phần dữ kiện quan trọng đặt **cuối prompt** (model nhỏ bám phần gần câu hỏi hơn), không viết cụm từ trong ngoặc kép (model nhỏ chép nguyên văn). |
| **Guardrails trước và sau model** | Trước: chặn tự hại, đòi dữ liệu người khác, tấn công prompt ("bỏ qua hướng dẫn…") → trả lời cố định. Sau: bộ lọc câu trả lời bỏ câu hứa suông, tự đoán nguyên nhân bệnh, khuyên dùng thuốc, nêu sai khoa, nguồn bịa dạng URL, chữ Hán lẫn vào; luôn chèn 115 khi cấp cứu. |
| **Prompt tóm tắt bệnh sử** | "Chỉ dùng dữ liệu được cung cấp, không suy đoán hay bổ sung thông tin y khoa khác." |

**Quy trình hoàn thiện prompt (nên kể — cho thấy làm thật, có đo):**
- Viết bộ kiểm thử `npm run eval-chat` (`scripts/eval-chatbot.js`), hiện **204 câu**, có hội thoại nhiều lượt,
  cố ý hỏi khác chữ so với câu mẫu.
- Hỏi dò 11 vòng (~1.900 lượt hỏi), mỗi lỗi tìm ra → sửa prompt/luật → thêm thành 1 câu test (kiểm thử hồi quy).
- Kết quả đo với `qwen3:1.7b`: prompt đầy đủ ban đầu **6/15** → prompt rút gọn + dữ kiện tính sẵn **15/15** →
  sau 11 vòng **204/204**, thời gian trung bình ~0,3 s.
- Bài học: với model nhỏ, prompt dài nhiều luật **làm kết quả kém đi**; việc chắc chắn đúng thì giao cho code,
  model chỉ lo phần ngôn ngữ.

---

## Câu 3. Chatbot có dùng RAG chống ảo giác không? Model Local hay gọi API? Tích hợp thế nào?

### 3.1. Có dùng RAG

**Nguồn tri thức:** 61 tài liệu PDF từ **Cẩm nang MSD** (bản tiếng Việt) chia theo 5 chuyên khoa
(Da liễu, Nhi, Răng–Hàm–Mặt, Sản phụ khoa, Tai–Mũi–Họng), thư mục `D:\AI\Chuyên khoa`.

**Giai đoạn Indexing** (`scripts/ingest-chuyen-khoa.js`):
1. Đọc PDF (`pdf-parse`), làm sạch header/footer lặp (URL, ngày in, số trang, bản quyền).
2. **Recursive chunking** (`src/lib/chunk.js`): cắt theo đoạn văn → câu, mỗi chunk ≤ 500 ký tự, **overlap 100 ký tự**.
3. Nhúng vector bằng **`gemini-embedding-001`** (3072 chiều, `taskType = RETRIEVAL_DOCUMENT`).
4. Lưu vào PostgreSQL + **pgvector**: bảng `kb_documents` (tên tài liệu) và `kb_chunks` (nội dung + vector).

**Giai đoạn Retrieval** (`retrieveKnowledge` trong `ai.js`):
- Nhúng câu hỏi (`RETRIEVAL_QUERY`), tìm **top-4** chunk gần nhất bằng **cosine similarity** (toán tử `<=>`).
- **RAG nâng cao:** **Multi-Query** (model sinh 3 cách hiểu khác của câu hỏi) + **HyDE** (model viết 1 câu trả lời
  giả định, nhúng như tài liệu) → tìm cho từng câu, gộp, mỗi chunk giữ điểm cao nhất, lấy top-4 chung.
  Bật mặc định với Gemini, tắt với model local (tốn thêm 1 lượt gọi).

**Giai đoạn Generation — các lớp chống ảo giác:**
1. Prompt: "chỉ dùng dữ kiện trong prompt", thuốc/liều chỉ khi có trong tài liệu và phải ghi **(Nguồn: tên tài liệu)**.
2. Nếu chunk khớp nhất có similarity > 0,6 → thêm "LƯU Ý: tài liệu khớp nhất là …, PHẢI trả lời theo tài liệu này".
3. Không tìm được tài liệu → prompt ghi rõ "không có tài liệu", quy tắc bảo khuyên đi khám / gọi hotline.
4. Dữ liệu động (giá, bác sĩ, lịch trống, lịch hẹn của bệnh nhân) **không qua RAG** mà lấy thẳng CSDL
   hoặc qua function calling → luôn đúng số liệu thật.
5. Câu có đáp án cố định (cấp cứu 115, tự hại, liều thuốc, lịch trống…) trả lời bằng code, không qua model.
6. Bộ lọc hậu kiểm xoá câu tự chẩn đoán / bịa nguồn; `temperature 0.3`.

### 3.2. Local hay API? — Cả hai, chọn bằng biến môi trường

| | API (mặc định) | Local |
|---|---|---|
| Biến | `AI_PROVIDER=gemini` | `AI_PROVIDER=ollama` |
| Model chat | Google **Gemini** (`gemini-3.6-flash`) qua SDK `@google/genai` | **Qwen3 1,7B** chạy bằng **Ollama** trên GPU laptop (RTX 3050 4 GB) |
| Ưu | Thông minh hơn, không cần máy | Không giới hạn lượt, dữ liệu không ra ngoài, ~0,3–4 s/câu |
| Nhược | Gói miễn phí giới hạn ~20 lượt/ngày/model | Model nhỏ → phải bù bằng prompt rút gọn + luật code |

- Embedding cho RAG tài liệu: Gemini `gemini-embedding-001` (API).
- Embedding cho câu trả lời mẫu: `qwen3-embedding:0.6b` chạy local trên Ollama (đổi sang local vì gói miễn phí
  Gemini chỉ 1000 lượt nhúng/ngày và đã hết thật khi kiểm thử).
- **Dự phòng (fallback):** Ollama lỗi → tự chuyển sang Gemini cho câu đó (trừ khi đã đặt lịch rồi, để không đặt trùng).
  Gemini lỗi 503/429 tạm thời → thử lại; hết hạn ngạch ngày → báo lịch sự cho người dùng.

### 3.3. Triển khai, tích hợp thế nào

- Lớp trừu tượng `src/lib/llm.js` gói 2 nhà cung cấp, các route chỉ gọi `llm.chatWithTools()` /
  `llm.generateJSON()` / `llm.generateText()` → đổi model không phải sửa nghiệp vụ.
- API: `POST /api/ai/chat` (chatbot trang chủ, không bắt buộc đăng nhập; có token thì đặt lịch + tra dữ liệu
  của chính mình), `POST /api/ai/summarize-patient` (bác sĩ), `/api/ai/examples` (admin dạy chatbot).
- Lịch sử hội thoại của người đăng nhập lưu ở `chat_conversations` / `chat_messages`, gửi lại vài lượt gần nhất
  cho model để hiểu câu hỏi tiếp nối.
- Đặt lịch qua chat: code gom thông tin (ngày, giờ, họ tên, SĐT…), tóm tắt, giao diện hiện nút
  "OK, đặt lịch / Từ chối / Sửa", xác nhận xong mới ghi vào CSDL — con người luôn xác nhận hành động thật.
- Bản deploy trên Render dùng được model local của laptop: laptop mở **đường hầm Cloudflare** tới 1 proxy có khoá
  (`OLLAMA_API_KEY`) chỉ cho qua `/api/chat` và `/api/embed`; script `npm run tunnel` báo địa chỉ cho server
  2 phút/lần. Laptop tắt → sau tối đa 5 phút server tự quay về Gemini.
- Bảo mật: khoá API chỉ để ở biến môi trường; công cụ dữ liệu cá nhân giới hạn theo id người đăng nhập
  và ghi nhật ký `record.self_view` / `invoice.self_view`.

---

## Câu hỏi phụ có thể bị hỏi vặn — trả lời sẵn

- **"RAG có hết ảo giác không?"** — Không hết hoàn toàn; RAG giảm ảo giác cho kiến thức y khoa, còn số liệu
  phòng khám lấy thẳng CSDL, câu nguy hiểm trả lời bằng code, có bộ lọc sau và bộ test 204 câu để đo.
- **"Vì sao không fine-tune?"** — Dữ liệu phòng khám thay đổi (giá, bác sĩ, lịch) → RAG + truy CSDL cập nhật
  ngay, không phải huấn luyện lại; fine-tune tốn GPU, dữ liệu ít.
- **"Vì sao chọn chunk 500, overlap 100?"** — Đủ 1–2 đoạn văn y khoa trọn ý; overlap giữ ngữ cảnh ở chỗ cắt.
- **"Đo chất lượng thế nào?"** — `npm run eval-chat`, 204 câu, tỷ lệ đúng và thời gian trung bình (bảng ở Câu 2).
- **"Hạn chế?"** — Tài liệu RAG mới có 5 khoa (Nội tổng quát chưa có tài liệu riêng); nhúng RAG vẫn cần Gemini
  kể cả khi chạy local; gói miễn phí giới hạn lượt; model 1,7B phải dựa nhiều vào luật code.
- **"Model local và API khác nhau thế nào khi chạy?"** — Local gọi HTTP `POST /api/chat` tới Ollama
  (`127.0.0.1:11434`), tắt chế độ "thinking" của Qwen3 để nhanh; API gọi Gemini qua SDK chính thức với API key.
