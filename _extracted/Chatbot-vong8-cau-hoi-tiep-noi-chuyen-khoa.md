# Huấn luyện chatbot — Vòng 8: câu hỏi tiếp nối về chuyên khoa (29/10/2026)

## Lỗi gốc (ảnh chụp từ web)

```
Khách: tôi bị đau đầu gối
Bot:   Bạn nên khám chuyên khoa Nội tổng quát. Bạn đang bị đau đầu gối. Mình xin kiểm tra lịch...
Khách: tại sao lại khám khoa nội tổng quát
Bot:   (lặp lại nguyên câu trên)
Khách: tại sao không thể khám khao khác
Bot:   (lặp lại nguyên câu trên)
```

Nguyên nhân:
1. Regex `'đau đầu'` khớp luôn trong "đau **đầu** gối" → bot hiểu là ĐAU ĐẦU, không phải đau gối.
2. Không có nhánh xử lý câu hỏi "tại sao / khoa khác": chữ "nội tổng quát" trong câu hỏi lại kích hoạt
   câu gợi ý cũ, model 1.7B chỉ chép lại câu trả lời trước.
3. Lỗi gõ "khao khác" không được sửa thành "khoa khác".

## Đã sửa (src/lib/chatAnalysis.js, src/routes/ai.js)

- `đau đầu(?! gối)`, thêm từ khoá xương khớp: đầu gối, cổ tay, cổ chân, thoái hoá, thoát vị, đĩa đệm,
  cột sống, bong gân, chuột rút, viêm khớp, loãng xương…; "gãy tay/chân/xương", "trật khớp" → cấp cứu.
- `detectSpecialtyFollowUp` → `'why'` (tại sao / vì sao / có chắc không / bác sĩ đó khám được không /
  "tại sao" cụt / khám không khỏi thì sao) hoặc `'other'` (khoa khác / đổi sang khoa X / không muốn khám nội).
- `explainSpecialty`: giải thích theo đúng triệu chứng khách đã kể trong hội thoại + "phòng khám chưa có khoa
  X riêng" (Cơ xương khớp, Thần kinh, Tim mạch, Tiết niệu, Nam khoa, Hậu môn – trực tràng, Nội tiết, Tiêu hoá,
  Hô hấp, Tâm thần – Tâm lý, Ung bướu).
- Hỏi lại lần 2 → câu "Nói gọn lại: …" khác chữ; câu trả lời model trùng ≥80% câu trước → thay bằng giải thích.
- `detectMissingDepartmentQuestion` ("có khoa cơ xương khớp không") → nói rõ chưa có, khám ban đầu ở Nội
  (trẻ em → Nhi, mang thai → Sản).
- `detectSpecialtyScopeQuestion` ("nội tổng quát là khoa gì") — model từng bịa "khám được mọi chuyên khoa".
- `detectDangerQuestion` ("có nguy hiểm không") — model từng khẳng định "không nghiêm trọng".
- Sửa lỗi cũ: "trẻ em" bị bắt là hỏi giá (regex "rẻ").
- "tai sao" không dấu → "tại sao" (trừ "đau tai sao…").
- Bộ lọc: bỏ câu "Mình xin kiểm tra…" và câu chỉ nhắc lại triệu chứng ("Bạn đang bị đau đầu gối.").

## Kết quả đo

| Vòng | Bộ thăm dò (hội thoại nhiều lượt) | Ghi chú |
|---|---|---|
| 1 | 106/113 | câu cụt "tại sao", "sao không khám nhi", "cổ tay sưng", lặp khi hỏi lại |
| 2 | 113/113 | đọc tay phát hiện model bịa: "không nghiêm trọng", "khám mọi chuyên khoa"… |
| 3 | 127/128 (1 cờ do điều kiện kiểm tra quá chặt) | |

`npm run eval-chat`: **128/128**, chạy 2 lần liền đều đạt.

Bộ thăm dò: `Chatbot-vong8-bo-tham-do-hoi-thoai.js` (cùng thư mục) — chạy
`node Chatbot-vong8-bo-tham-do-hoi-thoai.js 4000` khi server đang chạy cổng 4000.
