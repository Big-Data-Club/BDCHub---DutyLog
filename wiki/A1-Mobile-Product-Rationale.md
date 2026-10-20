> Chuyển từ báo cáo Assignment 1 của nhóm; giữ các giới hạn bằng chứng và phân biệt kế hoạch với kết quả thực tế.
> Nguồn: [02_mobile_rationale.tex](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/sections/02_mobile_rationale.tex) · [PDF đầy đủ](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf).

# Lý do chọn ứng dụng di động

## Nhiệm vụ và bối cảnh sử dụng

DutyLog dự kiến ghi nhận thời điểm thành viên đến và rời phòng, đồng thời theo dõi ca trực. Một việc khác thành viên có thể làm từ điện thoại cá nhân, kể cả khi chưa đến phòng, là xem phòng đang mở hay đóng, ai đang trực và hiện có ai (A1). Trong phiên bản thử nghiệm tối thiểu (MVP), người đang trực dùng điện thoại tại cửa để quét thẻ sinh viên hoặc mã QR của thành viên. Thành viên đưa thẻ hoặc mã cho người trực, không tự quét mã QR dán cố định ở cửa. Khảo sát chưa hỏi trực tiếp mô hình người trực dùng điện thoại quét, nên đây là phương án thử nghiệm chứ chưa phải lựa chọn được khảo sát xác nhận.

## Điểm mạnh của ứng dụng di động

Câu hỏi cần trả lời là *di động có cải thiện đáng kể nhiệm vụ thực tế hay không*. Với DutyLog, nhóm tách hai nhiệm vụ có bối cảnh khác nhau:

- **Ghi nhận tại cửa (người trực).** Người trực đứng hoặc ngồi gần cửa, thao tác ngắn và lặp đi lặp lại, thường bằng một tay. Camera của điện thoại giúp quét thẻ sinh viên/QR mà không cần mua đầu đọc riêng, và người trực xác nhận sự có mặt tại chỗ. Đây là lý do mạnh nhất cho một ứng dụng di động, vì tác vụ phụ thuộc vào camera, vị trí vật lý và một thiết bị luôn mang theo.

- **Tra cứu trước khi đến (thành viên).** Câu hỏi “phòng đang mở không, ai trực” thường xuất hiện khi thành viên đang ở ngoài, nên điện thoại cá nhân là thiết bị tự nhiên nhất. Nhiệm vụ này cũng có thể làm bằng web hoặc Google Sheet, nên bản thân nó *không* đủ để biện minh cho ứng dụng native; nó chỉ có giá trị khi đi cùng việc ghi nhận ở trên.

**Năng lực di động MVP chưa dùng.** Thông báo đẩy và chế độ offline là hai năng lực di động điển hình nhưng đã được hoãn khỏi MVP vì chưa có bằng chứng hành vi (13/35 dễ quên, 7/35 chọn nhắc khi quên, 8/35 gặp mạng trường không ổn định, trong khi 16/35 cho biết thao tác không phiền; các câu trả lời này chưa chứng minh nhắc nhở hay offline sẽ giải quyết vấn đề). Hệ quả cần nói thẳng: MVP hiện dựa chủ yếu vào *camera và thiết bị cá nhân*, và việc biết kịp thời khi lịch đổi (N7) chỉ xảy ra khi người dùng tự mở ứng dụng. Nếu pilot cho thấy lợi ích của camera không rõ so với phương án web, nhóm sẽ xem lại lựa chọn nền tảng.

**Triển khai thay thế.** Cùng ứng dụng DutyLog cũng có thể chạy trên tablet hoặc điện thoại dùng chung đặt tại cửa; đây là phương án cần so sánh trong pilot, không phải mô hình check-in đã chốt cho MVP.

## Hạn chế của ứng dụng di động

Màn hình điện thoại nhỏ nên giao diện cần ưu tiên các thao tác chính: quét mã và xem ai đang có mặt. Việc ghi nhận cũng phụ thuộc vào quyền truy cập camera, pin và kết nối mạng của điện thoại. Có một mâu thuẫn cần ghi nhận: người trực dùng ứng dụng đúng ở cửa phòng, nơi 8/35 người từng gặp mạng trường không ổn định, trong khi MVP chưa lưu thao tác để gửi sau. Khi mất mạng, MVP sẽ báo lỗi rõ ràng và cho thử lại hoặc nhập MSSV, không hiển thị như đã ghi nhận. Tần suất lỗi này được đo trong pilot (mục 4.5); nếu vượt ngưỡng, chế độ offline sẽ được xem xét lại (mục 9.4).

## So sánh với các nền tảng khác

Trong phần này, nhóm so sánh ứng dụng di động với các phương thức truyền thống, nền tảng Web App và thiết bị dùng chung đặt tại cửa. Các ưu, nhược điểm là nhận định cần kiểm chứng trong pilot; khảo sát không trực tiếp thử nghiệm các phương án này.

**So sánh ứng dụng di động với các phương án hiện có**

| **Phương án** | **Ưu điểm** | **Nhược điểm** | **Kết luận** |
| --- | --- | --- | --- |
| **Mobile App (Đề xuất)** | Thành viên xem trạng thái phòng từ điện thoại cá nhân. Người trực có thể quét thẻ SV/QR tại cửa; ứng dụng cũng có thể tự kết thúc ca. | Cần cài ứng dụng; việc ghi nhận phụ thuộc pin và kết nối mạng. | Phương án thử nghiệm, chưa được khảo sát ủng hộ rõ: khảo sát tự báo cáo, mẫu thuận tiện (n=35), có 10/35 chọn app quét QR và 13/35 chọn máy cố định. Nhóm thử cách người trực quét vì không cần đầu đọc riêng và có người xác nhận tại chỗ; cần kiểm chứng. |
| **Thiết bị dùng chung đặt ở cửa (tablet hoặc đầu đọc thẻ)** | Khảo sát tự báo cáo, mẫu thuận tiện (n=35): 13/35 chọn máy đặt tại phòng quét thẻ SV. Thành viên không cần cài ứng dụng riêng. | Phát sinh chi phí thiết bị; cần vị trí cố định, bảo quản và nguồn điện. | Phương án thay thế hợp lý, có thể phù hợp hơn tùy bối cảnh; cần so sánh trong pilot. Cùng ứng dụng DutyLog có thể được thử trên thiết bị dùng chung. |

*Bảng so sánh nền tảng (tiếp).*

| **Phương án** | **Ưu điểm** | **Nhược điểm** | **Kết luận** |
| --- | --- | --- | --- |
| **Sổ giấy / Group Chat** | Quen thuộc; không cần cài đặt ứng dụng riêng. | Thông tin có thể phân tán hoặc bị bỏ sót; việc tổng hợp có thể tốn thời gian. | Có thể dùng cho ghi nhận đơn giản; mức độ phù hợp với việc xem trạng thái nhanh cần kiểm chứng. |
| **Web App** | Không cần cài ứng dụng; truy cập qua trình duyệt trên nhiều thiết bị. | Người dùng cần mở trình duyệt và đăng nhập; quét camera liên tục qua trình duyệt phụ thuộc thiết bị và hệ điều hành; thông báo đẩy trên web (nếu cần sau này) có điều kiện hơn ứng dụng native, nhất là trên iOS. | Tra cứu trạng thái phòng hoàn toàn có thể làm bằng web. Lý do chọn native là việc quét tại cửa; giả thuyết này được kiểm tra bằng cách đo thời gian quét trên thiết bị thật (QA-01) và so với quét qua trình duyệt trước khi khóa quyết định. |

---

[Assignment 1](Assignment-1) · [Home](Home)
