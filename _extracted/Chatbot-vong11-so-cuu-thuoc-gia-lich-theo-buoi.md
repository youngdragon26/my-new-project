# Huấn luyện chatbot — Vòng 11: sơ cứu, cách uống thuốc, giá hỏi tiếp, lịch theo buổi (29/10/2026)

Model `qwen3:1.7b` (Ollama), server cổng 4000. Bộ dò: 135 mục (≈160 lượt) — triệu chứng mới, không dấu/teencode,
giá, lịch, ngoài phạm vi, tiếng Anh, 13 hội thoại nhiều lượt, 7 mục đã đăng nhập (tài khoản demo id 55; bỏ bước
xác nhận đặt lịch để không tạo lịch thật). Bộ câu: `Chatbot-vong11-bo-tham-do.json` (cùng thư mục).

Trước vòng này: dọn ghi chú toàn bộ mã nguồn (bỏ lịch sử "đo thật vòng X…", rút mỗi khối về 1–2 dòng nêu lý do),
eval vẫn 180/180.

## Lỗi tìm thấy

| Nhóm | Ví dụ thật |
|---|---|
| **Sai nghiêm trọng** | "vậy cả 2 thì sao" (BHYT + sinh viên) → cộng dồn 70.000đ; "sinh viên thì sao" → "giá vẫn là 200.000đ"; khách chưa đăng nhập gửi "Nguyễn Văn A 0912… 30 tuổi" → "**Bạn đã đăng nhập** và cung cấp đầy đủ thông tin"; "amoxicillin uống trước hay sau ăn" → model tự khuyên |
| Phản ứng quá mức | "chó cắn có cần tiêm không", "bị bỏng dầu ở tay" → bảo gọi 115 |
| Không nhận ra | hắc lào, tiền sản giật, vú có cục u, "lưỡi bị nhiệt", "siro ho gì", "đặt cọc", giấy khám sức khoẻ / khám lái xe |
| Liên hệ | "số điện thoại phòng khám" → bảo đăng nhập (không đưa hotline) |
| Bác sĩ | "bác sĩ Dung khám gì" → hỏi triệu chứng; "bác sĩ đó có làm thứ 7 không" → bịa "làm tất cả các chuyên khoa" |
| Lịch | "chiều nay khám TMH được không" → trả lời như câu "tại sao"; "chiều mai" liệt kê cả ngày; "mai 9h" → giải thích khoa |
| Tiếng Anh | "can I book an appointment for tomorrow" → tiếng Việt (bước thêm dấu biến "can" thành "cần") |
| Tán tỉnh | "bạn có người yêu chưa" → "Bạn có thể nói rõ hơn" |

## Đã sửa

- `detectFirstAid` (mới): chó/mèo cắn → hướng dẫn rửa vết thương + tiêm phòng dại; bỏng nhẹ → xả nước mát, không
  bôi kem đánh răng. Danh sách cấp cứu chỉ giữ chó cắn sâu/chảy máu nhiều, bỏng rộng/hoá chất/điện, trẻ bị bỏng, rắn cắn.
- Thuốc: `DOSE_RE` thêm "uống trước/sau ăn", "siro … gì"; `PRESCRIPTION_RE` thêm tên kháng sinh thông dụng; câu
  trả lời thêm ý "tuỳ từng thuốc — làm theo đơn/tờ hướng dẫn".
- Giá hỏi tiếp cụt sau câu trả lời giá: "sinh viên thì sao", "còn bhyt" → tính giá sau giảm; "cả 2" → không cộng dồn.
- Khách chưa đăng nhập gửi thông tin người khám → câu cố định "lịch CHƯA được đặt" + cách đăng nhập.
- Bác sĩ: "khám gì / khoa gì" → bác sĩ đó thuộc khoa nào; lịch làm việc nhận "có làm thứ 7"; "bác sĩ đó" lấy tên cả
  từ tin trước của khách.
- Lịch: "sáng/chiều/tối nay … khám được không", tin cụt "mai 9h"; lọc theo buổi (sáng < 12:00, chiều 12:00–17:59,
  tối ≥ 18:00); hôm nay đã qua giờ → "đã qua giờ khám" thay vì "hết chỗ".
- Từ khoá: hắc lào, ghẻ, chốc lở, mụn nhọt, á sừng, hăm (Da liễu); tiền sản giật, vú (Sản); "bị nhiệt" (RHM);
  hotline/số điện thoại phòng khám (liên hệ); đặt cọc (phí đặt lịch); giấy khám sức khoẻ (dịch vụ chưa công bố);
  "có người yêu" (ngoài phạm vi).
- Tiếng Anh: kiểm tra trên văn bản gốc, cần ≥2 từ tiếng Anh không trùng tiếng Việt không dấu ("do", "a", "can",
  "an", "to" bị loại — "da toi noi man do va ngua" từng bị nhận nhầm khi đổi sang văn bản gốc); thêm dòng hướng dẫn
  đặt lịch / giá khi khách hỏi.

## Kết quả

`npm run eval-chat` (EVAL_PATIENT_ID=55): thêm 24 ca → **204/204**, chạy 2 lần liền, trung bình 0,3 s.

## Còn để model trả lời (chấp nhận được, theo dõi tiếp)

"vú có cục u" (đúng khoa nhưng model hỏi thêm vòng vo), "tôi buồn chán không muốn làm gì" (không phải khủng hoảng,
model mời chia sẻ), câu hỏi lối sống ("tập thể dục bao nhiêu phút") — model nhắc "cơ sở tri thức", có thể thêm câu mẫu.
