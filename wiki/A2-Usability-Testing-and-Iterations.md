# A2 · Usability Testing & Design Iterations

> Ghi nhận kết quả thử nghiệm khả dụng trên nguyên mẫu tương tác với người tham gia ngoài nhóm (ẩn danh để bảo vệ quyền riêng tư) và các chỉnh sửa thiết kế tương ứng nhằm hoàn thiện trải nghiệm trước khi bước vào triển khai mã nguồn (Assignment 3).

---

## 1. Mục tiêu & Thiết lập thử nghiệm

- **Mục tiêu:** Đánh giá khả năng tự hoàn thành tác vụ cốt lõi trên Interactive Prototype mà không cần thành viên nhóm hướng dẫn; phát hiện điểm gây hiểu nhầm trong điều hướng, trạng thái phòng, luồng đăng ký ca và phản hồi quét điểm danh.
- **Phương pháp:** Think-aloud moderated usability testing (trực tiếp và qua chia sẻ màn hình), ghi nhận tỷ lệ hoàn thành tác vụ, thời gian hoàn thành (Time-on-Task), thao tác bấm nhầm và phản hồi định tính.
- **Quyền riêng tư:** Không công bố họ tên đầy đủ, MSSV, email hoặc ảnh gương mặt của người tham gia; các đối tượng thử nghiệm được mã hóa ẩn danh thành `P1`, `P2`, `P3`.

### Hồ sơ người tham gia (03 người ngoài nhóm phát triển)

| Mã ẩn danh | Nhóm người dùng đại diện | Kinh nghiệm liên quan | Thiết bị thử nghiệm | Ngày thử nghiệm |
|---|---|---|---|---|
| **P1** | Thành viên câu lạc bộ sinh viên | Thường xuyên lên phòng sinh hoạt học tập, chưa từng sử dụng DutyLog | iPhone 14 (Mobile Safari) | 2026-11-20 |
| **P2** | Sinh viên phụ trách trực phòng (CTV) | Từng trực phòng và điểm danh thủ công qua Google Form / Sheet | Samsung Galaxy S23 (Chrome Mobile) | 2026-11-21 |
| **P3** | Thành viên ban chủ nhiệm CLB | Thường xuyên theo dõi lịch trực và kiểm tra phòng mở/đóng qua tin nhắn nhóm | Laptop & iPad (Web Demo / Prototype) | 2026-11-21 |

---

## 2. Kịch bản tác vụ đại diện (Representative Tasks)

Người tham gia nhận tình huống thực tế và tự do thao tác trên nguyên mẫu tương tác (không nhận bất kỳ gợi ý nào về vị trí nút bấm từ nhóm):

- **Task 1 (Kiểm tra trạng thái phòng & chuyển cơ sở):** *"Bạn chuẩn bị di chuyển sang Cơ sở 1 và muốn biết phòng 605 C6 hiện có ai đang trực không, có bao nhiêu người đang có mặt, sau đó chuyển sang kiểm tra nhanh phòng 710 H6 ở Cơ sở 2."*
- **Task 2 (Đăng ký ca trực 4 bước):** *"Bạn muốn đăng ký một ca trực còn chỗ trống trong tuần này tại phòng 303 B9 và kiểm tra lại thông tin ca vừa đặt."*
- **Task 3 (Quét điểm danh & xử lý dự phòng):** *"Bạn đang trong ca trực và có một thành viên đến phòng nhưng thẻ sinh viên bị mờ không quét được camera. Hãy ghi nhận bạn ấy vào phòng bằng phương án dự phòng."*
- **Task 4 (Xuất trình mã QR cá nhân):** *"Bạn quên mang thẻ sinh viên khi đến phòng sinh hoạt. Hãy tìm và mở mã QR cá nhân trên ứng dụng để người trực quét."*

---

## 3. Kết quả quan sát (Findings)

### Tóm tắt hoàn thành tác vụ

| Người test | Task 1 (Xem / đổi phòng) | Task 2 (Đăng ký ca) | Task 3 (Quét / Nhập MSSV) | Task 4 (Mở QR cá nhân) | Ghi chú quan sát nổi bật |
|---|---|---|---|---|---|
| **P1** | Đạt (12s) | Đạt (28s) | Đạt có vướng (42s) | Đạt (9s) | Tìm phương án nhập MSSV thủ công hơi chậm khi camera không nhận diện được; luồng QR cá nhân mở rất nhanh. |
| **P2** | Đạt (14s) | Đạt (24s) | Đạt (22s) | Đạt (11s) | Nắm rất nhanh luồng chuyển đổi giữa quét Barcode và QR; đánh giá cao việc có thẻ phản hồi màu xanh xác nhận thành viên. |
| **P3** | Đạt có vướng (25s) | Đạt (31s) | Đạt (26s) | Đạt (8s) | Ban đầu nhầm lẫn giữa phòng C6 (Cơ sở 1) và H6 (Cơ sở 2) do nhãn cơ sở trước đây hiển thị kích thước chữ hơi nhỏ. |

### Danh sách vấn đề usability phát hiện được

| ID | Mức độ | Mô tả vấn đề quan sát được | Bằng chứng (Hành vi & Trích dẫn) | Nguyên nhân gốc |
|---|---|---|---|---|
| **U1** | Trung bình | Người dùng gặp lúng túng khi muốn chuyển từ quét camera sang nhập mã số sinh viên thủ công | P1 mất hơn 20 giây tìm kiếm trên màn hình quét camera và hỏi: *"Nếu thẻ trầy không quét được thì gõ MSSV ở đâu?"* | Nút chuyển đổi *"Nhập MSSV thủ công"* được thiết kế dạng chữ nhỏ ở góc dưới màn hình quét, độ tương phản chưa đủ nổi bật trên nền tối của camera. |
| **U2** | Trung bình | Thông tin phân biệt Cơ sở 1 và Cơ sở 2 trên thẻ chọn phòng chưa thực sự tách bạch | P3 bấm nhầm phòng 710 H6 khi đang tìm phòng ở Cơ sở 1 và chia sẻ: *"Nhìn lướt qua chỉ thấy số phòng 605 với 710 chứ không để ý ngay là ở cơ sở Dĩ An hay Quận 10."* | Nhãn cơ sở (Campus) đặt ngang hàng với tên tòa nhà và dùng kích thước chữ `10px`, thiếu huy hiệu (badge) phân nhóm rõ ràng theo địa điểm. |
| **U3** | Thấp | Người dùng chưa rõ cơ chế hoạt động của thanh đếm ngược 10 giây trên mã QR cá nhân | P1 mở mã QR và ngập ngừng không biết khi hết 10 giây mã có tự đổi hay phải bấm nút làm mới thủ công | Thiếu dòng ghi chú phụ giải thích cơ chế: *"Mã tự động làm mới liên tục sau mỗi 10 giây để chống chụp ảnh màn hình."* |

---

## 4. Cải tiến thiết kế sau thử nghiệm (Design Iterations: Before → After)

Dựa trên các vấn đề thực tế ghi nhận từ người tham gia thử nghiệm, nhóm đã thực hiện 2 cải tiến thiết kế trực tiếp trên giao diện:

### Cải tiến 1: Tối ưu nút chuyển đổi sang "Nhập MSSV thủ công" trên màn hình quét (Khắc phục U1)
- **Trước khi sửa (Before):** Nút nhập thủ công chỉ là một dòng liên kết text đơn giản (`Nhập mã thủ công ›`) đặt sát đáy màn hình, dễ bị chìm khi camera bật và khó thao tác một tay.
- **Sau khi sửa (After):** Thiết kế lại thành một nút bấm dạng viên thuốc (Pill Button) có nền kính mờ (`rgba(255,255,255,0.2)`), viền trắng nổi bật kèm biểu tượng bàn phím đặt ngay dưới khung ngắm camera, giúp người trực nhận biết ngay phương án dự phòng khi quét thẻ thất bại.
- **Hiệu quả đạt được:** Trong lần thử nghiệm kiểm tra lại với P1, thời gian chuyển sang nhập MSSV thủ công giảm từ **42 giây xuống còn 14 giây**, không còn câu hỏi ngập ngừng.

### Cải tiến 2: Bổ sung huy hiệu phân loại cơ sở trực quan tại danh sách chọn phòng (Khắc phục U2)
- **Trước khi sửa (Before):** Thông tin cơ sở chỉ hiển thị text thường dạng `Campus 1 · C6 · P.605`, các phòng hiển thị chung một danh sách đơn điệu.
- **Sau khi sửa (After):** Bổ sung Chip màu phân tách rõ rệt: **Campus 1 (Quận 10)** dùng Chip xanh dương nhạt (`#ECF3FF`), **Campus 2 (Thủ Đức)** dùng Chip cam nhạt (`#FFF8E7`), đồng thời chia nhóm rõ ràng trong danh sách chọn phòng (`RoomPickerScreen`).
- **Hiệu quả đạt được:** Người tham gia P3 nhận diện chính xác vị trí phòng ngay từ cái nhìn đầu tiên, loại bỏ hoàn toàn việc chọn nhầm cơ sở.

---

[Assignment 2](Assignment-2) · [Design System & Prototype](A2-Design-System-and-Prototype) · [Home](Home)
