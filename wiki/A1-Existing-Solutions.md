> Chuyển từ báo cáo Assignment 1 của nhóm; giữ các giới hạn bằng chứng và phân biệt kế hoạch với kết quả thực tế.
> Nguồn: [06_existing_solutions.tex](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/sections/06_existing_solutions.tex) · [PDF đầy đủ](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf).

# Các cách giải quyết hiện có

## Phân tích từng giải pháp

### Giải pháp 1: Bảng tính trực tuyến (Google Sheets / Excel Online)

Một trang tính dùng chung có thể giúp ghi tên và giờ trực với chi phí thấp, đồng thời dễ chỉnh sửa. Vì dữ liệu do người dùng tự nhập, có thể phát sinh lỗi hoặc ghi đè nhầm. Bản thân trang tính không xác nhận người trực có mặt tại phòng; việc nhắc khi hết ca và thao tác trên điện thoại còn phụ thuộc cách thiết lập. Trong khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35), 21/35 người chọn nhóm cách tra cứu gồm Google Sheet, Form hoặc lịch trực; 12/35 cho biết từng gặp lịch thay đổi mà mọi người không biết và 8/35 không biết ai đang giữ hoặc trực phòng. Đây là số liệu gộp theo nhóm cách tra cứu, không xác định riêng người dùng Google Sheets hay chứng minh quan hệ nhân quả.

### Giải pháp 2: Báo cáo qua nhóm chat (Zalo / Messenger / Discord)

Một cách khác là yêu cầu thành viên báo giờ bắt đầu và kết thúc ca trong nhóm chat. Cách này thuận tiện vì thành viên thường đã có ứng dụng nhắn tin. Tuy nhiên, khi nhóm có nhiều tin nhắn, việc tìm lại thông tin ai đang ở phòng có thể mất thời gian; nếu không có quy ước chung, ban quản lý có thể phải tổng hợp thủ công. Khảo sát gộp chung các công cụ tra cứu (mục 6.1.1) nên không cho biết riêng mức độ dùng nhóm chat. Điều cần học thêm: nhóm chat của CLB có đang là nơi hỏi “có ai ở phòng không” hay không; việc này có thể kiểm tra bằng cách đếm tin nhắn trong nhóm (mục 4.3). Một điểm đáng chú ý là nhóm chat có thể *đẩy* thông báo khi lịch đổi, điều mà bảng tính tự nó không làm; đây là đối thủ mạnh nhất của DutyLog ở nhu cầu thông báo thay đổi lịch.

### Giải pháp 3: Khảo sát trực tuyến (Google Forms / Microsoft Forms)

Ban quản lý có thể dán mã QR ở cửa để thành viên mở biểu mẫu và khai báo giờ đến. Biểu mẫu có thể tự lưu thời điểm gửi và chuyển câu trả lời vào bảng tính. Nếu biểu mẫu chỉ dùng đường dẫn hoặc mã QR tĩnh, người dùng có thể gửi câu trả lời từ xa; vì vậy, cách này tự nó chưa xác nhận được người trả lời đang có mặt tại phòng. Việc ghi nhận lúc kết thúc ca và hiển thị trạng thái trực tiếp cần cấu hình hoặc công cụ bổ sung. Khảo sát không tách riêng mức độ dùng Google Forms (mục 6.1.1). Phát hiện cần ghi nhận: cách ghi bằng biểu mẫu có sẵn dấu thời gian nhưng thiếu xác nhận tại chỗ và thiếu trạng thái “hiện tại”, và đó cũng là lý do nhóm tạm loại phương án thành viên tự quét QR cố định (mục 9.4).

### Giải pháp 4: Máy chấm công vật lý (Vân tay / Thẻ từ)

Thiết bị chấm công đặt tại cửa có thể ghi nhận lượt ra vào bằng thẻ hoặc vân tay. Cách này cần mua và bảo trì thiết bị; tùy loại máy, có thể cần nguồn điện, kết nối mạng và phần mềm quản lý. Nhóm chưa thử nghiệm phương án này, nên cần so sánh thêm chi phí và mức độ phù hợp với câu lạc bộ.

### Giải pháp 5: Công cụ quản lý công việc (Trello / Notion)

Một số câu lạc bộ có thể dùng Trello hoặc Notion để ghi ai đang ở phòng. Người dùng có thể chuyển thẻ tên vào cột “Đang ở phòng” khi đến và chuyển ra khi rời đi. Cách này cho phép xem danh sách và ghi chú, nhưng thao tác trên điện thoại, tính tổng giờ và xác nhận có mặt tại cửa còn phụ thuộc cách thiết lập; nhóm chưa thử nghiệm quy trình này.

### Giải pháp 6: Ứng dụng xếp ca Connecteam

Connecteam giới thiệu ứng dụng di động để lập và quản lý lịch ca nhân viên [Connecteam — nguồn tham khảo của báo cáo](https://connecteam.com/employee-scheduling-app/shift-scheduling/). Đây là một sản phẩm có thật để tham khảo khi so sánh DutyLog với ứng dụng xếp ca chuyên dụng. Nhóm chưa đăng ký dùng thử hoặc kiểm tra trực tiếp các tính năng, chi phí và cách xác nhận vị trí của sản phẩm; nội dung này dựa trên thông tin do nhà cung cấp công bố.

### Giải pháp 7: Phiên bản DutyLog hiện có của nhóm

Nhóm đã có một phiên bản ứng dụng gồm đăng nhập, chọn tổ chức và phòng trực, màn ca trực/nhật ký và máy quét mã vạch/QR. Đây là giải pháp “gần nhất” mà nhóm có thể tự quan sát. Điều nhóm cần học từ nó, thay vì coi nó là đáp án: ai đã thực sự dùng, dùng ở bước nào, bước nào bị bỏ qua, và việc quét có làm chậm cửa phòng không. Báo cáo này *chưa* có số liệu sử dụng của phiên bản đó, nên chưa đánh giá được hiệu quả; việc thu log và quan sát ca trực thật được đưa vào kế hoạch (UX-02, QA-01).
Theo bảng theo dõi roadmap (12/10/2026), nhiều phần mới ở mức đã viết mã, chưa chạy thực tế; một số đường đi của ứng dụng hiện có còn trả về thành công giả (mock) cần loại bỏ trước khi pilot (xem F-02, MB-06, BE-11 ở mục 12). Vì vậy nhóm chưa thu được số liệu sử dụng thật.

## Bảng so sánh tóm tắt

| **Giải pháp** | **Chi phí** | **Khả năng xác thực vị trí** | **Quản lý tổng quan** | **Giao diện Mobile (nhận định)** |
| --- | --- | --- | --- | --- |
| Google Sheets | Miễn phí | Rất thấp | Thấp | Nhập tay nhiều thao tác |
| Group Chat | Miễn phí | Rất thấp | Rất thấp | Tiện lợi |
| Google Forms | Miễn phí | Thấp (dễ chia sẻ link) | Trung bình | Dễ thao tác |
| Máy chấm công | Chi phí thiết bị và bảo trì | Tùy loại máy | Tùy phần mềm đi kèm | Tùy mẫu thiết bị |
| Trello / Notion | Miễn phí | Rất thấp | Khá tốt | Nhiều bước kéo thả |
| Connecteam Scheduling | Theo gói nhà cung cấp | Tùy cấu hình | Lập và xem lịch ca | Có ứng dụng di động |
| DutyLog hiện có | Chi phí phát triển, máy chủ | Cần xác minh (người trực quét) | Cần xác minh | Có ứng dụng di động |
| **DutyLog (đề xuất)** | Thấp (không cần phần cứng, dự kiến) | Trung bình đến cao (người trực xác nhận tại chỗ, cần kiểm chứng) | Dự kiến cao (gần thời gian thực) | Dự kiến nhanh gọn |

**Bảng so sánh các giải pháp quản lý ca trực hiện có (các nhận định là đánh giá của nhóm, chưa thử nghiệm trực tiếp; dòng DutyLog là dự kiến)**

## Kết luận và điều rút ra

**Nhu cầu nào đã được đáp ứng khá đủ.** Bảng tính, biểu mẫu và nhóm chat đều lưu được giờ giấc với chi phí gần như bằng không và không cần cài đặt; với một CLB nhỏ, đó là mức đáp ứng đủ cho việc ghi lại *ai trực ca nào*. Điều này cũng phù hợp với việc 21/35 người đang tra cứu bằng Sheet, Form hoặc lịch trực (số liệu gộp, không chứng minh công cụ nào tốt hay kém).

**Khoảng trống còn lại (giả thuyết dựa trên phân tích, chưa kiểm chứng).**

- *Trạng thái “bây giờ”.* Sheet và chat là nhật ký theo thời gian; muốn biết phòng hiện có ai phải đọc ngược hoặc hỏi người khác.

- *Xác nhận có mặt.* Các công cụ miễn phí không chứng minh người khai báo đang ở phòng; biểu mẫu với QR tĩnh còn cho phép khai báo từ xa.

- *Thông báo khi lịch đổi.* Sheet không đẩy thông tin đến người dùng; chat có thể đẩy nhưng dễ trôi. Đây có thể là phần khớp nhất với tín hiệu 12/35 từng gặp lịch đổi mà không biết.

- *Tổng hợp giờ trực.* Có thể tốn công, nhưng đây là nhu cầu của ban quản lý (A7) mà nhóm chưa kiểm chứng.

**Điều nhóm học được và hệ quả.** (1) Đối thủ mạnh nhất là *nhóm chat kết hợp Sheet* vì quen thuộc và miễn phí; DutyLog chỉ có chỗ đứng nếu thật sự trả lời tốt hơn câu hỏi “bây giờ có ai/phòng mở chưa”. (2) Nếu pilot cho thấy nỗi đau chính chỉ là thông báo đổi lịch, một quy ước trên nhóm chat có thể đã đủ, và nhóm cần cân nhắc thu hẹp sản phẩm (mục 3.3, cổng G1 ở mục 12). (3) Connecteam là ứng dụng xếp ca chuyên dụng nhưng nhóm chưa tự dùng thử, nên không đánh giá được; báo cáo chỉ dùng nó để tham chiếu phạm vi.

**Điểm khác biệt có thể có của DutyLog (giả thuyết cần kiểm chứng):** gộp ba thứ mà từng công cụ trên chỉ làm một phần: trạng thái phòng ngay lúc này, người trực xác nhận tại chỗ bằng điện thoại (không cần mua đầu đọc riêng trong pilot), và lịch/thay đổi lịch trong cùng ứng dụng. Cách người trực quét chưa được khảo sát hỏi trực tiếp và chưa chứng minh tăng độ tin cậy; cần so sánh với thiết bị dùng chung đặt tại cửa. Tác động đến chi phí và công tổng hợp sẽ được đo trong thử nghiệm.

**Điều cần làm thêm.** Nhóm chưa quan sát trực tiếp quy trình của một CLB và chưa dùng thử các công cụ so sánh. Bước tiếp theo là dùng thử ít nhất hai giải pháp (Sheet/Form hiện CLB đang dùng, và một ứng dụng điểm danh QR hoặc Connecteam bản thử) và ghi lại thao tác, thời gian, lỗi gặp phải; A1 và A7 vẫn cần kiểm chứng.

---

[Assignment 1](Assignment-1) · [Home](Home)
