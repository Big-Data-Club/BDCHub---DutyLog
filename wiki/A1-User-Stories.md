> Chuyển từ báo cáo Assignment 1 của nhóm; giữ các giới hạn bằng chứng và phân biệt kế hoạch với kết quả thực tế.
> Nguồn: [11_user_stories.tex](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/sections/11_user_stories.tex) · [PDF đầy đủ](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf).

# Nhu cầu người dùng

## Từ bằng chứng đến nhu cầu và yêu cầu

Các nhu cầu dưới đây lấy từ mục 7.1; mức độ tin cậy được giữ nguyên như trong đánh giá bằng chứng. Nhu cầu N6 chưa có bằng chứng trực tiếp nên được ghi là giả thuyết. R1 là yêu cầu nền tảng cho US1: đăng nhập tài khoản thành viên, trong phạm vi MVP một CLB và không có bước chọn tổ chức.

| **Nhu cầu ID** | **Nhu cầu (nguồn)** | **Yêu cầu liên quan** |
| --- | --- | --- |
| N1 | Tra cứu phòng đang mở, ai đang có mặt, ai đang trực (A1; một bộ phận người dùng) | R6 |
| N2 | Ghi nhận nhanh, lợi ích rõ ràng; có người chỉ ghi nhận khi có ca trực (A2) | R2, R5 |
| N3 | Sở thích phương thức ghi nhận không đồng nhất (A3) | R3, R4 |
| N4 | Xem lịch trực và biết ai đang trực (A4, A5) | R2, R6 |
| N5 | Hay quên, vội, nhiều bước, mạng kém (A6) | R4, R5 |
| N6 | *Giả thuyết:* ban quản lý cần góc nhìn tập trung (A7, chưa kiểm chứng) | R6 |
| N7 | Biết kịp thời khi lịch hoặc ca thay đổi (A5; khảo sát tự báo cáo, mẫu thuận tiện, n=35; 12/35 từng gặp lịch thay đổi mà mọi người không biết) | R2, R6 |

**Yêu cầu chức năng**

| **Yêu cầu ID** | **Yêu cầu** | **Nhu cầu liên quan** |
| --- | --- | --- |
| R1 | Đăng nhập tài khoản thành viên vào DutyLog của một CLB; không có bước chọn tổ chức | Nền tảng |
| R2 | Xem lịch ca được phân công, chọn ca và bắt đầu/kết thúc ca | N2, N4, N7 |
| R3 | Người trực ghi nhận thành viên bằng cách quét thẻ sinh viên hoặc QR | N3 |
| R4 | Có phương án ghi nhận dự phòng bằng MSSV thủ công và QR cá nhân | N3, N5 |
| R5 | Tự kết thúc ca và check-out các thành viên còn lại khi hết giờ | N2, N5 |
| R6 | Hiển thị trạng thái phòng, người trực, người có mặt, ca kế tiếp và thay đổi lịch | N1, N4, N6, N7 |

## Các nhu cầu sử dụng

| **ID** | **Nhu cầu sử dụng** | **Nhu cầu ID** | **Yêu cầu ID** | **Chức năng** |
| --- | --- | --- | --- | --- |
| US1 | Là thành viên CLB, tôi muốn đăng nhập bằng tài khoản của mình và được nhận đúng vai trò (thành viên hoặc người trực), để chỉ thấy và làm được những việc dành cho mình mà không phải thiết lập lại. | Nền tảng | R1 | F1 |
| US2 | Là người được phân công trực, tôi muốn chọn phòng và ca của mình rồi bắt đầu ca để mọi người biết ai đang trực phòng và nhận biết thay đổi lịch hoặc ca. | N2, N4, N7 | R2 | F2 |
| US3 | Là người đang trực, tôi muốn quét thẻ sinh viên hoặc QR của thành viên chỉ trong vài giây khi họ vào và ra, để cửa phòng không bị ùn tắc mà danh sách người có mặt vẫn đúng. | N2, N3, N5 | R3 | F3 |
| US4 | Là người đang trực, khi thẻ hoặc QR không quét được, tôi muốn nhập MSSV thủ công để vẫn ghi nhận được thành viên đó. | N3, N5 | R4 | F4 |
| US5 | Là thành viên CLB, tôi muốn có mã QR cá nhân trong ứng dụng để vẫn được ghi nhận khi quên thẻ sinh viên. | N3, N5 | R3, R4 | F5 |
| US6 | Là người đang trực, tôi muốn ca tự kết thúc và các thành viên còn lại được tự check-out khi hết giờ nếu tôi quên, để trạng thái phòng và giờ trực không bị sai. | N2, N5 | R5 | F6 |
| US7 | Là thành viên CLB, tôi muốn xem phòng đang mở hay đóng, ai đang trực, ai đang có mặt và lịch/ca kế tiếp cùng thay đổi lịch, để quyết định có đến phòng hay không mà không phải hỏi trong nhóm chat. | N1, N4, N7 | R6 | F7 |
| US8 | Là thành viên ban quản lý, tôi muốn xem một màn hình trạng thái phòng và ca trực hiện tại để kiểm tra việc trực mà không phải hỏi từng người. *(giả thuyết, cần kiểm chứng trong pilot)* | N6 | R6 | F7 |

## Tiêu chí chấp nhận

Mỗi câu chuyện có tiêu chí kiểm tra được để dùng cho thiết kế và kiểm thử ở các bước sau. Các con số là ngưỡng pilot do nhóm đề xuất (mục 4.5), chưa phải kết quả đo.

| **ID** | **Tiêu chí chấp nhận (đề xuất)** |
| --- | --- |
| US1 | Đăng nhập thành công đưa vào đúng màn hình theo vai trò; thao tác ghi yêu cầu phiên đăng nhập hợp lệ; sai thông tin hiển thị lỗi rõ ràng. |
| US2 | Chỉ thấy các ca được phân công cho mình; bắt đầu ca làm phòng chuyển sang “Đang trực”; chọn sai ca có thông báo và chọn lại được. |
| US3 | Thời gian quét trung bình không quá 4 giây/lượt trên thiết bị thật; kết quả hiển thị rõ (“đã vào”/“đã ra”) và cho hoàn tác; mã không hợp lệ báo “không tìm thấy”. |
| US4 | Chỉ người đang trực nhập được MSSV; bản ghi được đánh dấu “nhập thủ công”; tỷ lệ nhập thủ công được thống kê (mục tiêu dưới 15%). |
| US5 | Mã QR cá nhân hiển thị trong hồ sơ, có hạn dùng và tự làm mới; quét mã hết hạn bị từ chối. |
| US6 | Khi hết giờ ca, ca tự đóng và các thành viên còn lại được check-out; bản ghi tự động được đánh dấu để phân biệt với check-out thủ công. |
| US7 | Màn hình hiển thị phòng mở/đóng, người trực, người có mặt (nếu được phép xem), ca kế tiếp và thay đổi lịch; khi không tải được dữ liệu, hiện dữ liệu lần cuối kèm giờ cập nhật và nút Tải lại. |
| US8 | (Giả thuyết) Thành viên ban quản lý xem được cùng màn hình trạng thái; cần xác nhận qua phỏng vấn trước khi mở rộng. |

---

[Assignment 1](Assignment-1) · [Home](Home)
