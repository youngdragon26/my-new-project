# Chatbot — đặt lịch qua chat do code điều khiển (29/10/2026)

## Lỗi (ảnh chụp, khách đã đăng nhập)

```
Khách: thân tuấn vũ 21 nam 0353012966
Bot:   ...Bạn muốn khám tại chuyên khoa nào?
Khách: bị đau bụng
Bot:   ...Bạn cần cung cấp ngày khám và giờ khám cụ thể...
Khách: ngày 1 lúc 9h
Bot:   Bạn muốn khám vào ngày 1/10 (ngày mai) lúc 9:00...      ← sai ngày
Khách: không
Bot:   ...Bạn có thể đặt lịch trực tiếp qua chat bằng công cụ book_appointment.   ← không bao giờ đặt
```

Nguyên nhân: model qwen3:1.7b không tự gọi được công cụ `book_appointment`, tự tính sai ngày và làm lộ tên
công cụ nội bộ.

## Cách sửa

Khi khách đã đăng nhập (chế độ prompt rút gọn), **code điều khiển cả luồng** (`bookingFlowReply` trong
`src/routes/ai.js`). Model không tham gia luồng này.

1. Gom thông tin từ mọi tin của khách kể từ lần đặt/huỷ gần nhất, tin sau ghi đè tin trước:
   - `parsePatientDetails`: họ tên, tuổi, giới tính, số điện thoại ("thân tuấn vũ 21 nam 0353012966",
     "tên tôi là…", "Nguyễn Văn Nam 30 tuổi" thì "Nam" vẫn là tên, "45" trả lời câu hỏi tuổi).
   - `parseBookingDate`: hôm nay/mai/ngày kia, "thứ 7", "thứ 2 tuần sau", "5/11", "ngày 5 tháng 11",
     "ngày 1" = ngày 1 sắp tới.
   - `parseBookingTime`: "9h", "9 giờ 30", "2h chiều", "9h rưỡi".
   - Chuyên khoa lấy từ triệu chứng ("bị đau bụng" → Nội tổng quát); lý do khám lấy từ tin kể triệu chứng.
2. Kiểm tra và báo rõ lỗi: ngày không có trên lịch, ngày đã qua, Chủ nhật (phải đặt ở /dat-lich.html để
   chọn bác sĩ), giờ ngoài 07:00–20:30 hoặc không phải mốc 30 phút, số điện thoại thiếu số, khung giờ đã kín
   (kèm 3 giờ trống gần nhất).
3. Thiếu gì thì hỏi đúng phần đó. Đủ thông tin thì tóm tắt; giao diện tự hiện 3 nút OK / Từ chối / Sửa.
4. Khách xác nhận → code gọi thẳng `bookAppointmentTool`, trả mã lịch. Khách sửa ("đổi sang 14h") → tóm tắt
   lại. Khách huỷ → báo chưa có lịch nào được đặt.
5. Bộ lọc câu trả lời model: bỏ câu nhắc tên công cụ nội bộ (book_appointment, check_available_slots…).

## Kết quả thử (server cổng 4100, tài khoản benhnhan.test@example.com)

- Đúng hội thoại trong ảnh: "ngày 1" → báo 01/11/2026 là Chủ nhật; "ngày 2 lúc 9h" → tóm tắt;
  "Xác nhận" → **Đặt lịch thành công (mã #53)**. Lịch thử #53 đã xoá khỏi CSDL ngay sau đó.
- Các kịch bản: thiếu từng phần, nhập sai (30/2, 21h, 9h15, số điện thoại 7 số), sửa giờ, huỷ giữa chừng: đều đúng.
- `npm run eval-chat`: 128/128.

Kịch bản thử: `Chatbot-dat-lich-qua-chat-kich-ban-thu.js` (cần server đang chạy và `JWT_SECRET` trong `.env`).
