> Chuyển từ báo cáo Assignment 1 của nhóm; giữ các giới hạn bằng chứng và phân biệt kế hoạch với kết quả thực tế.
> Nguồn: [01_direction.tex](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/sections/01_direction.tex) · [PDF đầy đủ](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf).

# Định hướng dự án

## Vấn đề

Tại phòng sinh hoạt của một câu lạc bộ sinh viên, thông tin về *phòng đang mở hay đóng, ai đang trực, lịch trực có vừa đổi không* hiện được ghi và hỏi bằng sổ giấy, bảng tính hoặc tin nhắn trong group chat. Các cách này khiến dữ liệu dễ thiếu, không đồng nhất, và thành viên không có một nơi duy nhất để biết nhanh tình trạng phòng trước khi đến. Nhóm cũng muốn biết liệu câu hỏi *hiện tại ai đang thực sự ở trong phòng* có phải là nhu cầu đủ thường xuyên để đáng xây dựng (giả định A1, mục 3).

## Người dùng mục tiêu

- **Người dùng cuối:** thành viên thường xuyên sinh hoạt hoặc trực phòng của CLB sinh viên, trong đó có người được phân công trực ca (người ghi nhận ra vào cho các thành viên khác).

- **Người quản lý:** ban chủ nhiệm / ban điều hành CLB, người cần nắm tình hình trực phòng và tổng hợp giờ trực. Nhu cầu của nhóm này hiện là *giả định* (A7), vì khảo sát ban đầu chưa hỏi trực tiếp họ.

## Bối cảnh và cách xử lý hiện tại

Vấn đề xảy ra tại cửa phòng sinh hoạt, khi thành viên đến hoặc rời phòng, và khi người khác muốn biết trước tình trạng phòng hoặc lịch ca trước khi đến. Địa điểm pilot cụ thể: Big Data Club -- HCMUT, hiện có 3 phòng sinh hoạt ở hai cơ sở (605 C6 và một phòng ở B9 tại Cơ sở 1; 710 H6 tại Cơ sở 2). Trong 35 người trả lời khảo sát, 15 người từng dùng 605 C6, 5 người dùng 710 H6 và 4 người dùng phòng B9 (có thể chọn nhiều phòng). Việc các phòng nằm ở hai cơ sở là lý do để *giả thuyết* rằng biết trước tình trạng phòng có giá trị, vì đi nhầm cơ sở tốn nhiều thời gian hơn đi nhầm tầng; giả thuyết này chưa được kiểm chứng.

**Hiện trạng sản phẩm.** DutyLog không bắt đầu từ con số không: nhóm đã có một phiên bản ứng dụng và mã nguồn ban đầu (đăng nhập, chọn phòng/ca trực, nhật ký ca, máy quét mã) cùng một roadmap kỹ thuật (mục 12). Vì vậy Assignment 1 được dùng để kiểm tra lại *nên giữ, thu hẹp hay bỏ phần nào* của hướng đã có, chứ không phải để chứng minh hướng đó đúng; các task trong mục 12 chỉ là phần cần bổ sung hoặc kiểm tra thêm so với phiên bản hiện có. Phiên bản hiện có cũng được đưa vào phân tích ở mục 6.
Theo bảng theo dõi roadmap (cập nhật 12/10/2026), chưa task nào hoàn thành; 12 task đang làm và 10 task ở trạng thái Review (mã đã viết, chưa chạy thực tế, chưa merge). Do đó nhóm **chưa có số liệu sử dụng thật** của phiên bản hiện có, và các giá trị của nó vẫn là giả thuyết giống phần còn lại của báo cáo.

**Cách thành viên xử lý hiện nay.** Theo khảo sát (tự báo cáo, mẫu thuận tiện, n=35; chi tiết và giới hạn ở mục 5), 21/35 người cho biết hiện xem Google Sheet, Form hoặc lịch trực; 6/35 không kiểm tra trước; 3/35 ghé phòng; 3/35 chưa có cách nào tiện (có thể chọn nhiều đáp án). Các giải pháp được phân tích ở mục 6; việc so sánh khả năng xác minh hiện diện và chi phí ở đó là đánh giá của nhóm, chưa phải kết quả thử nghiệm.

**Mức độ của vấn đề còn tranh cãi.** 16/35 người chưa gặp vấn đề đáng kể (10/21 trong nhóm đã từng lên phòng; 10/18 trong nhóm có lên phòng tháng gần đây). Những người báo cáo khó khăn nêu hai nhóm vấn đề đi cùng nhau: *lịch/ai trực* (15/35: lịch đổi mà không biết 12, không biết ai trực 8) và *hiện diện* (13/35: quên báo đã tới hoặc rời phòng 9, phải hỏi nhiều người mới biết tình trạng phòng 5, thông tin Sheet/chat không còn đúng 2); 11 người gặp cả hai nhóm. Nhu cầu biết *ai đang có mặt* cũng ít được chọn hơn nhu cầu biết phòng mở hay đóng, nhất là ở người có lên phòng gần đây (7/18 so với 9/18). Đây là bằng chứng tự báo cáo, chưa phải hành vi quan sát; mức độ phổ biến và tần suất của vấn đề vẫn cần kiểm chứng (mục 3, 4).

## Hướng giải pháp đề xuất

DutyLog là ứng dụng di động giúp biết phòng sinh hoạt đang mở hay đóng, ai đang trực và (ở mức thử nghiệm) ai đang có mặt. Người đang trực dùng điện thoại quét thẻ sinh viên hoặc mã QR cá nhân của thành viên khi họ đến và rời phòng; nếu không quét được, người trực nhập MSSV. Khi hết ca, ứng dụng tự kết thúc ca và ghi nhận những thành viên còn lại đã rời phòng. Thành viên xem trạng thái phòng, người trực và lịch ca kế tiếp từ điện thoại cá nhân.

Thông báo nhắc nhở và báo cáo cho ban quản lý là các hướng cần kiểm chứng, chưa thuộc phiên bản đầu (xem mục 9).

## Thay đổi so với ý tưởng ban đầu

Ý tưởng ban đầu hướng tới việc thành viên tự check-in/check-out bằng QR hoặc thẻ sinh viên cho mọi lượt ra vào, kèm nhắc nhở và tự động check-out. Sau khi đánh giá bằng chứng (mục 7), nhóm điều chỉnh như sau:

- **Giữ mục tiêu cốt lõi nhưng thu hẹp phạm vi.** Có 24/35 người nói sẽ check-in/out mỗi lần nếu thao tác nhanh, nhưng đó là ý định có điều kiện và còn một số người chỉ muốn ghi nhận khi có ca trực hoặc khi thấy lợi ích rõ (A2, quyết định *Revise*). Vì chưa có bằng chứng hành vi, nhóm không bắt buộc mọi lượt ra vào ngay từ phiên bản đầu mà tập trung vào thông tin hiện diện cho người trực và người cần tra cứu.

- **Chưa khóa phương thức ghi nhận.** Sở thích về phương thức (máy đặt tại phòng quét thẻ 13/35, quét QR phòng bằng điện thoại cá nhân 10/35, nút trong ứng dụng, tự động) không đồng nhất (A3, *Investigate further*). Mô hình *người trực quét thẻ/QR* mà nhóm chọn **chưa được khảo sát hỏi trực tiếp**; lý do chọn là thực tế (không cần đầu đọc riêng, có người xác nhận tại chỗ), chưa phải bằng chứng ủng hộ. Nhóm sẽ so sánh với phương án thiết bị dùng chung đặt ở cửa trong pilot (mục 8, 9).

- **Hoãn một số hạng mục, không phải vì thiếu quan tâm.** 16/35 chọn đăng ký/đổi ca và 7/35 chọn nhắc khi quên check-out; các lựa chọn này thể hiện quan tâm nhưng chưa chứng minh hành vi hoặc hiệu quả. Đăng ký/đổi ca và nhắc nhở được hoãn khỏi MVP để kiểm chứng sau; dashboard/báo cáo cũng được hoãn vì chưa hỏi trực tiếp ban quản lý (A7).

---

[Assignment 1](Assignment-1) · [Home](Home)
