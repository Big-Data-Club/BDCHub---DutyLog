> Chuyển từ báo cáo Assignment 1 của nhóm; giữ các giới hạn bằng chứng và phân biệt kế hoạch với kết quả thực tế.
> Nguồn: [10_mvp_impact_effort.tex](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/sections/10_mvp_impact_effort.tex) · [PDF đầy đủ](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf).

# Phạm vi phiên bản MVP và ưu tiên

## Mục tiêu người dùng và luồng giá trị chính

**Mục tiêu chính của người dùng:** ghi nhận sự hiện diện tại phòng sinh hoạt một cách nhanh chóng để người trực và thành viên biết *hiện tại trong phòng có ai*, đồng thời tra cứu lịch ca và thay đổi liên quan.

**Các bước sử dụng chính:**

Đăng nhập vào DutyLog (MVP cho một CLB) → chọn phòng & ca, bắt đầu ca → người trực quét thẻ SV / QR thành viên (hoặc nhập MSSV) → check-in / check-out → trạng thái phòng và lịch ca cập nhật → hết ca tự đóng

Giá trị chỉ xuất hiện khi hai điều kiện cùng đúng: (1) việc ghi nhận đủ nhanh để người trực chịu dùng; (2) màn hình trạng thái phản ánh đúng ai đang ở trong phòng. Vì vậy MVP không dừng ở check-in mà phải bao gồm cả màn hình trạng thái phòng.

**MVP được thiết kế như một bản thử nghiệm (pilot).** Theo mục 7, bằng chứng hiện có chỉ là khảo sát tự báo cáo: A1, A3, A7 ở trạng thái *Investigate further*; A2, A4, A5, A6 ở trạng thái *Revise*. Do đó MVP không coi các giá trị này là đã được xác nhận mà dùng chính sản phẩm để đo: tỷ lệ ca có ghi nhận hiện diện, thời gian check-in, tần suất mở màn hình trạng thái phòng, số lần phải nhập MSSV thủ công và số ca phải tự kết thúc.

## Ma trận tác động và công sức

Nhóm chấm **tác động** từ 1 đến 5 theo mức đóng góp cho đường giá trị chính (mục 9.1) và độ mạnh của bằng chứng; **công sức** là số ngày công ước tính từ kế hoạch ở mục 12, trong đó task dùng chung chỉ được tính một lần ở chức năng chính. Đây là đánh giá của nhóm, không phải phép đo; điểm số chỉ để buộc nhóm nêu lý do.

| **ID** | **Tác động (1--5)** | **Căn cứ** | **Công sức (ngày)** | **Task tính vào** |
| --- | --- | --- | --- | --- |
| F1 | --- (nền tảng) | Điều kiện kỹ thuật để dùng các chức năng khác; không tự tạo giá trị. | ≈ 6,5 | F-05, BE-09, BE-10, MB-01 |
| F2 | 4 | “Ai đang trực” do ca tạo ra; 21/35 có thể tham gia trực nếu lịch phù hợp (ý định). | ≈ 5 | F-04, MB-02, NEW-04 |
| F3 | 4 | Là cách duy nhất để có dữ liệu hiện diện, nhưng dựa trên A2/A3 có bằng chứng yếu; mô hình quét chưa được hỏi trực tiếp. | ≈ 11,5 | MB-05, MB-06, BE-12, QR-01, QA-01 |
| F4 | 3 | Dự phòng khi thẻ/QR/camera lỗi; giá trị phụ thuộc F3. | ≈ 3 | NEW-01 |
| F5 | 2 | Trùng chức năng với F4 trong việc xử lý quên thẻ; cần thêm bảo mật token. | ≈ 4 | BE-11, MB-08 |
| F6 | 4 | Quên check-out làm sai trạng thái (13/35 dễ quên); chi phí thấp. | ≈ 2 | NEW-02 |
| F7 | 5 | 21/35 muốn biết phòng mở/đóng; 12/35 gặp lịch đổi không biết; 8/35 không biết ai trực. | ≈ 5 | BE-13, NEW-03 |

Ngưỡng dùng để xếp vào ma trận: tác động cao khi điểm ≥ 4; công sức thấp khi ≤ 3 ngày công.

|  | **Công sức thấp (≤ 3 ngày)** | **Công sức cao (>3 ngày)** |
| --- | --- | --- |
| **Tác động cao (≥ 4)** | - F6 Tự kết thúc ca khi hết giờ<br>*→ Làm ngay (MVP)* | - F2 Chọn phòng & ca, bắt đầu / kết thúc ca<br>- F3 Người trực quét thẻ / QR check-in, check-out (công sức lớn nhất)<br>- F7 Trạng thái phòng gần thời gian thực<br>*→ Vẫn thuộc MVP vì là lõi giá trị; giảm công sức bằng lịch ca nhập sẵn và dịch vụ có realtime sẵn. F3 là rủi ro lớn nhất về tiến độ.* |
| **Tác động thấp / vừa (≤ 3)** | - F4 Nhập MSSV thủ công<br>*→ Giữ trong MVP vì là phương án dự phòng của F3* | - F5 QR cá nhân<br>*→ Giữ có điều kiện; là ứng viên cắt đầu tiên nếu thiếu thời gian (F4 đã xử lý quên thẻ)* |
| **Ngoài MVP** | - Nhật ký giờ trực cá nhân<br>*→ Làm nếu dư thời gian* | - Push nhắc nhở<br>- Đăng ký / đổi ca, khai báo khung giờ<br>- Dashboard, báo cáo, xuất Excel<br>- Chế độ offline<br>- Thành viên tự quét QR cố định ở cửa<br>*→ Loại khỏi MVP* |

Tổng công sức của F1--F7 theo bảng trên khoảng 37 ngày công; phần còn lại của 68,5 ngày công ở mục 12 là các task dùng chung (CI, UX, QA, OPS, kiểm thử). Việc F3 chiếm gần một phần ba công sức cho một chức năng chưa được khảo sát trực tiếp là lý do nhóm đặt cổng quyết định G1 trước khi hoàn thiện F3 (mục 12).

## Chức năng trong MVP và lý do

| **ID** | **Chức năng** | **Lý do thuộc MVP** | **Giả định** |
| --- | --- | --- | --- |
| F1 | Đăng nhập | Đăng nhập tài khoản thành viên; MVP triển khai cho một CLB nên không có bước chọn tổ chức. | Một CLB |
| F2 | Chọn phòng & ca, bắt đầu / kết thúc ca | Ca trực là đơn vị tạo ra thông tin “ai đang trực”. Lịch do quản trị nhập sẵn (cách nhập trong pilot: NEW-04); hỗ trợ xem ca và bắt đầu/kết thúc ca, không có đăng ký hay đổi ca trong MVP. Khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35), ghi nhận 21/35 có thể tham gia trực nếu lịch phù hợp; phần này là ý định, cần kiểm chứng bằng pilot. | A4, A5 |
| F3 | Người trực quét thẻ SV / QR thành viên để check-in, check-out | Đây là mô hình thử nghiệm; khảo sát chưa hỏi trực tiếp cách người trực quét. Người trực ghi nhận tại cửa, thành viên đưa thẻ hoặc mã. | A2, A3, A6 |
| F4 | Nhập MSSV thủ công | Phương án dự phòng khi thẻ, QR hoặc camera lỗi. Sở thích ghi nhận không đồng nhất (A3), rào cản gồm nhiều bước và mạng kém (A6). | A3, A6 |
| F5 | QR cá nhân trong hồ sơ | Giải quyết trường hợp quên thẻ và là cơ sở để thử thành viên tự đưa QR ở thiết bị dùng chung. Chức năng này trùng một phần với F4, cần thêm bảo mật token (BE-11, MB-08), nên là ứng viên cắt đầu tiên nếu thiếu thời gian. | A3, A6 |
| F6 | Tự kết thúc ca và tự check-out khi hết giờ | Quên check-out làm sai trạng thái phòng và giảm độ tin cậy dữ liệu (A1, A2). Cài đặt đơn giản theo giờ kết thúc ca, không cần push. Hiệu quả vẫn là giả thuyết cần đo trong pilot (A6). | A2, A6 |
| F7 | Trạng thái phòng: mở / đóng, người trực, người có mặt, lịch/ca kế tiếp và thay đổi lịch | Khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35): 21/35 chọn biết phòng mở/đóng, 16/35 biết phòng có ai, 9/35 xem lịch trực, 9/35 xem ai đang trực; 12/35 từng gặp lịch đổi mà mọi người không biết. Hiển thị lịch và thay đổi lịch kiểm chứng A4/A5/N7; không bao gồm đăng ký/đổi ca. Nhu cầu quản lý tập trung A7 chưa được khảo sát. | A1, A4, A5, A7 |

## Chức năng chưa đưa vào MVP

| **Chức năng** | **Lý do loại** | **Điều kiện xem lại** |
| --- | --- | --- |
| Push nhắc nhở | Khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35), 7/35 chọn nhắc khi quên check-out; có quan tâm nhưng chưa chứng minh hiệu quả của thông báo nền. F6 xử lý hậu quả của việc quên trong MVP. | Pilot cho thấy tỷ lệ ca phải tự kết thúc cao |
| Đăng ký / đổi ca, khai báo khung giờ | Khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35), 16/35 chọn đăng ký/đổi ca; có quan tâm, nhưng ý định chưa chứng minh hành vi và quy trình cần xác nhận với ban quản lý (A7). | Có số liệu đăng ký thực tế và quy trình được xác nhận sau khi phỏng vấn ban quản lý |
| Dashboard, báo cáo, xuất Excel | A7: chưa phỏng vấn ban quản lý nên chưa xác nhận nhu cầu. | Phỏng vấn ban quản lý xác nhận nhu cầu |
| Thành viên tự quét QR cố định ở cửa | Khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35), 10/35 chọn mở app cá nhân quét QR của phòng nên có thể cần xem lại. Tạm loại vì QR cố định có thể bị chụp lại để check-in từ xa như Google Forms (mục 6.1.3), cần cơ chế xác thực thêm. | Pilot cho thấy mô hình người trực quét gây nghẽn hoặc phương án QR cố định có xác thực phù hợp hơn |
| Chế độ offline | Khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35), 8/35 nêu mạng trường không ổn định; MVP báo lỗi rõ ràng và cho thử lại, chưa lưu hàng đợi offline. | Pilot ghi nhận mất mạng thường xuyên và nhu cầu offline rõ ràng |
| Nhiều tổ chức, phân quyền chi tiết, tích hợp điểm rèn luyện | Ngoài phạm vi môn; MVP chạy với một CLB. | Sau khi pilot thành công |

## Rủi ro và câu hỏi còn bỏ ngỏ

- **Nhu cầu chưa được xác nhận (A1, A7).** Mức độ phổ biến của nhu cầu xem trạng thái phòng và nhu cầu của ban quản lý chưa có bằng chứng hành vi. Cần phỏng vấn ban quản lý trước khi đầu tư thêm cho phần quản trị.

- **Hành vi chưa quan sát được (A2).** Chưa biết thành viên có chịu check-in mỗi lần hay chỉ khi có ca trực; pilot sẽ đo.

- **Dự phòng làm yếu xác thực.** Nhập MSSV thủ công có thể bị lạm dụng; giảm thiểu bằng việc chỉ người đang trực mới nhập được và đánh dấu bản ghi “nhập thủ công” để theo dõi.

- **Mạng kém.** MVP không hỗ trợ offline; ghi nhận thất bại phải hiển thị rõ và cho thử lại để không tạo cảm giác đã ghi nhận.

- **Lịch ca nhập thủ công.** Nếu không ai nhập lịch thì F2 không có dữ liệu; cần quy định người chịu trách nhiệm nhập lịch trong pilot.

- **Đảo trạng thái khi quên một lượt.** Luồng 1 xác định check-in/check-out dựa trên trạng thái hiện tại; nếu một lượt bị bỏ sót, lượt sau sẽ ghi ngược. Giảm thiểu: hiển thị rõ kết quả (“đã vào”/“đã ra”), cho hoàn tác, và đo tỷ lệ sửa lại trong pilot.

- **Biết kịp thời khi lịch đổi (N7) khi không có thông báo đẩy.** MVP chỉ cho xem khi người dùng mở ứng dụng; nếu pain chính là lịch đổi, MVP có thể chưa giải quyết được và nhóm cần xem lại việc hoãn thông báo (mục 9.4).

- **Quyền riêng tư.** Danh sách “ai đang có mặt” và lịch sử ra vào là dữ liệu cá nhân (MSSV, giờ có mặt). Cần quy định ai được xem (chỉ người trực/ban quản lý hay mọi thành viên), thời gian lưu và thông báo cho thành viên biết trước khi pilot.

- **Phụ thuộc bản DutyLog hiện có.** Một phần F1--F3, F7 có thể đã được cài đặt; nếu chưa kiểm kê (F-02), ước tính công sức và rủi ro tiến độ có thể lệch.

- **Mô hình người trực quét chưa được hỏi trực tiếp.** Khảo sát tự báo cáo, lấy mẫu thuận tiện (n=35), phương án máy đặt cố định tại phòng quét thẻ SV được chọn nhiều nhất (13/35). Pilot cần so sánh mô hình này với người trực dùng điện thoại quét.

---

[Assignment 1](Assignment-1) · [Home](Home)
