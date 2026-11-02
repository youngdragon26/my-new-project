# CLAUDE.md — quy tắc chung cho toàn bộ thư mục D:\AI

## Quy trình sau mỗi yêu cầu (bắt buộc)

Sau khi hoàn thành xong **mỗi yêu cầu** có thay đổi code hoặc tài liệu, luôn làm đủ 3 bước trước khi trả lời:

1. **Cập nhật README.md** của dự án vừa sửa (mặc định là `duc-minh-backend/README.md`):
   thêm/sửa mô tả tính năng, cách chạy, biến môi trường… cho khớp với thay đổi vừa làm.
   Không để README mô tả sai so với code hiện tại.
2. **Làm sạch code** ở những file vừa sửa: xoá code thừa/không dùng, `console.log` debug,
   code bị comment bỏ, import không dùng; giữ đúng phong cách code xung quanh.
   Chỉ dọn trong phạm vi file liên quan, không tự ý refactor phần khác.
3. **Tài liệu hướng dẫn** (hướng dẫn cài đặt, sử dụng, ghi chú, bản trích xuất nội dung…)
   thì lưu vào thư mục `D:\AI\_extracted\`, **không** để lẫn trong thư mục code của dự án.
   README.md của dự án vẫn giữ nguyên vị trí.

Cuối câu trả lời, ghi ngắn gọn đã cập nhật gì trong README, đã dọn gì, và đã lưu file nào vào `_extracted`.

## Ghi chú khác

- Tên học phần đúng: **Ứng dụng Trí tuệ nhân tạo** (không phải "Phát triển ứng dụng AI").
