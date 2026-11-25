# A2 · Product Refinement, Change Log & MVP Alignment

> Đối chiếu với tài liệu giai đoạn đầu: [Định hướng dự án](A1-Project-Direction), [Phạm vi MVP](A1-MVP-and-Impact-Effort), [Các luồng sử dụng chính](A1-Critical-User-Flows).

---

## 1. Tinh chỉnh định hướng sản phẩm sau Assignment 1

### Problem Statement (Tinh chỉnh)
Tại các phòng sinh hoạt của câu lạc bộ sinh viên (thí điểm tại Big Data Club — HCMUT với 3 phòng ở 2 cơ sở: **605 C6**, **303 B9** tại Cơ sở 1 và **710 H6** tại Cơ sở 2), việc quản lý ca trực và ghi nhận hiện diện bằng sổ giấy, bảng tính hoặc nhóm chat khiến:
1. Thành viên không có một nguồn tin duy nhất để biết phòng đang mở hay đóng, ai đang trực và hiện có bao nhiêu người trước khi di chuyển giữa hai cơ sở.
2. Người trực phòng tốn nhiều thao tác thủ công khi điểm danh, dễ sót lượt check-out hoặc ghi nhận sai người ngoài tổ chức.
3. Lịch trực thay đổi hoặc phân ca thiếu minh bạch khiến người dùng khó nắm ca kế tiếp.

### Target Users
- **Người trực phòng (Duty Staff):** Thành viên được phân công trực ca, cần mở/kết thúc ca nhanh, quét thẻ sinh viên hoặc mã QR cá nhân (hoặc nhập MSSV dự phòng) để ghi nhận vào/ra chính xác.
- **Thành viên CLB (Club Member):** Cần xem nhanh trạng thái phòng, số người hiện diện, lịch trực và dùng mã QR cá nhân khi đến phòng.
- **Ban quản lý CLB (Club Leadership / Admin):** Theo dõi lịch sử ca trực, lịch sử ra vào phòng và kiểm tra các trường hợp ngoài tổ chức.

### Unique Value Proposition (UVP)
**DutyLog** gom toàn bộ vòng đời vận hành phòng sinh hoạt — từ **xem trạng thái phòng theo thời gian thực**, **đăng ký / quản lý ca trực**, đến **quét thẻ SV / QR xoay vòng 10 giây** với phản hồi tức thì — vào một ứng dụng di động duy nhất, giảm thao tác xuống vài giây ngay tại cửa phòng.

---

## 2. Change Log: Các thay đổi quan trọng từ Assignment 1 → Assignment 2

Bảng dưới đây ghi nhận và giải trình các điều chỉnh giữa phạm vi MVP đã chốt ở Assignment 1 ([A1-MVP-and-Impact-Effort](A1-MVP-and-Impact-Effort)) và thiết kế sản phẩm ở Assignment 2:

| Hạng mục | Trạng thái ở Assignment 1 | Điều chỉnh ở Assignment 2 | Lý do & Căn cứ thay đổi |
|---|---|---|---|
| **Đăng ký ca trực (Shift Registration — 4 bước)** | Tạm hoãn khỏi MVP (chỉ xem lịch có sẵn) vì lo ngại khối lượng công việc và chưa xác nhận quy trình | **Đưa vào thiết kế & prototype chính thức** (luồng 4 bước: Tổ chức → Phòng & Ngày → Ca trống → Xác nhận + Hủy ca) | 1. Khảo sát A1 ghi nhận **16/35** người tham gia quan tâm trực tiếp đến đăng ký/đổi ca và **21/35** sẵn sàng trực nếu lịch phù hợp.<br>2. Kiến trúc kỹ thuật v2 (`RegistrationScreen.tsx`, `reservations.ts`, `backend/internal/registration/`) đã hoàn thiện sẵn với cơ chế idempotency và kiểm tra trùng giờ, nên rủi ro tiến độ cho Assignment 3 thấp. |
| **Chọn tổ chức (Organization Context)** | Giả định pilot 1 CLB duy nhất (bỏ bước chọn tổ chức) | **Tự động vào thẳng tổ chức nếu chỉ thuộc 1 CLB; chỉ hiện màn hình chọn nếu thuộc > 1 CLB** | Giữ trải nghiệm 0 bước thừa cho sinh viên chỉ thuộc BDC (đúng tinh thần A1), đồng thời không phá vỡ kiến trúc đa tổ chức của hệ sinh thái BDC Hub khi mở rộng. |
| **Kiến trúc điều hướng (Navigation)** | Chưa khóa cấu trúc tab cụ thể ở A1 | **Bottom Navigation 5 mục** (`Trang chủ`, `Ca trực`, nút `Quét` nổi ở giữa, `Hoạt động`, `Cá nhân`) | Đưa thao tác cốt lõi nhất của người trực (`Quét`) vào vị trí trung tâm dễ chạm bằng một tay, đồng thời giữ thông tin trạng thái phòng & hoạt động ngay tại `Trang chủ`. |
| **Minh bạch trạng thái lỗi mạng & xác thực thành viên** | Đề xuất báo lỗi rõ, không lưu offline giả | **Chuẩn hóa phản hồi trạng thái rõ ràng:** cảnh báo Xanh (thành viên hợp lệ), Đỏ (ngoài tổ chức / chưa có tài khoản), banner lỗi mạng kèm nút thử lại, không báo thành công giả | Trực tiếp xử lý rủi ro A6 (mạng trường không ổn định) và nguyên tắc *"The server is authoritative"* từ Engineering Handbook. |
| **Các tính năng tiếp tục giữ ngoài phạm vi MVP** | Push notification, Dashboard xuất Excel, Offline queue hoàn chỉnh, Tự quét QR cố định ở cửa | **Tiếp tục loại khỏi phạm vi cốt lõi A2/A3** | Tránh phình phạm vi không cần thiết; tập trung làm sâu trải nghiệm cốt lõi và khả thi triển khai trong Assignment 3. |

---

## 3. MVP Feature ↔ Screen ↔ User Flow Mapping

| ID | Tính năng MVP (Refined) | Màn hình tương ứng (Figma & `mobile/`) | User Flow |
|---|---|---|---|
| **F1** | Đăng nhập (Tài khoản / Google Sign-In) & nhận diện tổ chức | `LoginScreen`, `OrgSelectionScreen` (chỉ khi > 1 CLB) | Flow 1, 2, 3 |
| **F2** | Xem lịch ca, chọn phòng & bắt đầu / kết thúc ca trực | `HomeScreen`, `RoomPickerScreen`, `ShiftsScreen`, `DutyStationScreen` | Flow 1 |
| **F3** | Người trực quét thẻ SV / QR xoay vòng để check-in, check-out | `ScanCheckinScreen` (chế độ Barcode & QR Scan) | Flow 1 |
| **F4** | Nhập MSSV thủ công (dự phòng khi camera/thẻ lỗi) | `ScanCheckinScreen` (panel nhập MSSV dự phòng) | Flow 1 |
| **F5** | Mã QR cá nhân xoay vòng 10 giây trong hồ sơ | `QRDisplayScreen`, lối tắt từ `HomeScreen` & `ProfileScreen` | Flow 2 |
| **F6** | Kết thúc ca & cơ chế đóng ca / tự check-out khi hết giờ | `HomeScreen` (nút Kết thúc ca + xác nhận), trạng thái ca đã hoàn tất ở `ShiftsScreen` | Flow 1 |
| **F7** | Trạng thái phòng (đang trực, sĩ số, hoạt động gần đây, lịch sử) | `HomeScreen`, `ActivityScreen`, `RoomPickerScreen` | Flow 2 |
| **F8** *(Bổ sung A2)* | Đăng ký ca trực 4 bước & xem/hủy ca đã đặt | `RegistrationScreen`, `RegistrationSuccessScreen`, `ShiftsScreen` | Flow 3 |

---

[Assignment 2](Assignment-2) · [Updated User Flows & States](A2-User-Flows-and-States) · [Home](Home)
