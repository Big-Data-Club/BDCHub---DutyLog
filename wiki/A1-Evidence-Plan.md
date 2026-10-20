> Chuyển từ báo cáo Assignment 1 của nhóm; giữ các giới hạn bằng chứng và phân biệt kế hoạch với kết quả thực tế.
> Nguồn: [04_evidence_plan.tex](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/sections/04_evidence_plan.tex) · [PDF đầy đủ](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf).

# Kế hoạch thu thập thông tin

## Giả định và lý do

**Claim cần kiểm chứng (A1):** *trước khi đến phòng, thành viên cần biết phòng đang mở hay đóng, ai đang trực và (hoặc) hiện có ai, và thông tin đó làm thay đổi quyết định đến phòng của họ.* Đây là giả định quan trọng vì nếu thông tin này không giúp thành viên quyết định có đến phòng, DutyLog chưa chứng minh được giá trị chính, và các chức năng ghi nhận ra vào (F3--F6) mất lý do tồn tại.

**Vai trò của khảo sát đã làm.** Khảo sát (03--12/10) là bước *khám phá* để biết người dùng đang tra cứu thế nào và gặp khó khăn gì. Nó không thể kiểm chứng A1 vì chỉ đo trải nghiệm và ý định tự báo cáo, không đo việc thông tin có thay đổi quyết định hay không. Phần kế hoạch dưới đây vì vậy mô tả các bước *tiếp theo* để kiểm chứng A1, và được viết sau khi đã có kết quả khảo sát.

## Đã biết và chưa biết

- **Đã biết từ khảo sát tự báo cáo, mẫu thuận tiện (n=35):** 21/35 người xem Google Sheet, Form hoặc lịch trực để tra cứu; 12/35 từng gặp lịch thay đổi mà mọi người không biết; 8/35 không biết ai đang giữ hoặc trực phòng. Trong nhóm đã từng lên phòng (n=21), các số liệu tương ứng là 14/21, 7/21 và 5/21. Đồng thời, 16/35 người trả lời chưa gặp vấn đề đáng kể (10/21 trong nhóm đã từng lên phòng).

- **Chưa biết:** thành viên có thực sự mở màn hình tra cứu trước khi đến không; thông tin nào (mở/đóng, người trực, người có mặt, ca kế tiếp) thực sự ảnh hưởng quyết định; tần suất người hỏi nhau trong nhóm chat; dữ liệu trạng thái phòng cần cập nhật nhanh, chính xác đến mức nào; và nhu cầu của ban quản lý (A7).

## Câu hỏi nghiên cứu và phương pháp

### Giả định ưu tiên A1: nhu cầu tra cứu trạng thái phòng

- **Câu hỏi nghiên cứu:** Trước khi đến phòng, người dùng có thể xem trạng thái phòng và dựa vào thông tin đó để quyết định có đến hay không? Họ cần nhìn thấy phòng mở/đóng, người trực, người có mặt hay lịch ca kế tiếp?

- **Bằng chứng đã thu thập:** xem mục “Đã biết” ở trên.

- **Phương pháp, kết hợp ba nguồn có chi phí thấp:**

- *Phân tích dữ liệu sẵn có (hành vi thật trong quá khứ).* Đếm các tin nhắn hỏi kiểu “có ai ở phòng không / phòng mở chưa / hôm nay ai trực” trong nhóm chat nội bộ CLB và các lần chỉnh sửa lịch trực trên Sheet trong 30 ngày gần nhất; ghi lại thời điểm hỏi và thời gian có người trả lời. Nếu phiên bản DutyLog hiện có đã được dùng thật, thêm số lượt mở màn hình trạng thái từ log.

- *Phỏng vấn ngắn 2--3 thành viên ban chủ nhiệm và 2--3 người từng trực ca* (cũng phục vụ A7): quy trình theo dõi hiện nay, thời gian tổng hợp giờ trực, lần gần nhất có sự cố về lịch/ai trực.

- *Thử nguyên mẫu màn hình tra cứu (quan sát tác vụ).* Mời 8 thành viên Big Data Club qua nhóm nội bộ, chia 4 người đã từng lên phòng (trong đó ưu tiên người lên phòng thường xuyên) và 4 người chưa từng lên phòng. Giao tình huống cụ thể (xác định phòng mở/đóng, người trực, ca kế tiếp; hỏi “bạn có đến phòng không” trước và sau khi xem), ghi lại việc tìm đúng thông tin, thời gian tìm, điểm gây nhầm lẫn và câu trả lời.

- **Giới hạn:** nhóm tham gia nhỏ, tuyển qua kênh nội bộ nên có thiên lệch thiện chí; thử nguyên mẫu không đo hành vi lâu dài. Kết quả phải được tách theo kinh nghiệm sử dụng phòng, và dữ liệu nhóm chat chỉ phản ánh những người đang dùng nhóm đó.

## Đối tượng tham gia / quan sát

Khảo sát đã thu câu trả lời từ 35 người trong mẫu thuận tiện; 21 người từng lên phòng và 14 người chưa từng lên phòng. Thử nghiệm tiếp theo mời 8 thành viên Big Data Club như mô tả ở trên (4 + 4), cộng 2--3 thành viên ban chủ nhiệm và 2--3 người từng trực ca để phỏng vấn. Địa điểm thử dùng cùng CLB/phòng được xác định tại mục 1.3; kết quả cần tách riêng theo kinh nghiệm sử dụng phòng.

## Tiêu chí đánh giá kết quả

- **Đánh giá khảo sát đã hoàn thành:** dùng các số liệu tự báo cáo làm dấu hiệu ban đầu, không áp ngưỡng pilot hồi cứu. A1 có cả tín hiệu quan tâm (21/35 thường xem Sheet/Form/lịch trực; 12/35 gặp lịch đổi không được biết; 8/35 không biết ai đang trực) và ý kiến trái chiều (16/35 chưa gặp vấn đề đáng kể). Khảo sát chưa đủ để kết luận A1 đã được xác nhận.

- **Tiêu chí cho thử nguyên mẫu A1 (đề xuất, chốt trước khi thử).** Tính trên 8 người và báo cáo riêng cho nhóm 4 người đã từng lên phòng:

- *Ủng hộ (Support):* ít nhất 6/8 người xác định đúng trạng thái phòng và ca kế tiếp trong lần đầu; ít nhất 6/8 cho biết thông tin đủ để quyết định mà không cần hỏi lại trong nhóm chat; trong nhóm đã từng lên phòng, ít nhất 3/4 nói thông tin này có thể đổi quyết định đến phòng.

- *Bị thách thức (Challenge):* ít nhất 4/8 vẫn muốn nhắn hỏi người khác hoặc cho rằng thông tin không cần thiết, hoặc dữ liệu nhóm chat cho thấy rất ít câu hỏi về trạng thái phòng (đề xuất: dưới 1 câu hỏi mỗi tuần).

- *Chưa kết luận (Unresolved):* các trường hợp còn lại, hoặc từ 3 người trở lên không tìm được thông tin chủ yếu do giao diện nguyên mẫu gây nhầm lẫn.

    Các ngưỡng trên là đề xuất của nhóm cho cỡ mẫu rất nhỏ, dùng để tránh diễn giải sau khi thử, không phải ý nghĩa thống kê.

- **Chỉ số pilot sản phẩm, không áp dụng cho khảo sát đã làm (đề xuất):**

- *Độ chính xác của danh sách người có mặt:* so khớp với đối chiếu thủ công tại một số thời điểm lấy mẫu trong ca (ví dụ người trực đếm nhanh): ít nhất 90% thời điểm khớp. Đây là chỉ số quan trọng nhất vì giá trị của DutyLog nằm ở việc danh sách đúng.

- Tỷ lệ ca có ghi nhận ít nhất 80% (chỉ đo mức sử dụng, không đo độ đầy đủ).

- Thời gian quét trung bình không quá 4 giây/lượt; nhập MSSV dự phòng dưới 15%; ít nhất 2 lượt xem trạng thái/thành viên/tuần.

- Nếu lỗi quét hoặc mất mạng vượt 30% nhưng người dùng vẫn chấp nhận do chưa có phương án khác, kết quả chưa đủ để kết luận.

    Các ngưỡng này do nhóm đề xuất, chưa có đường cơ sở; sẽ được điều chỉnh sau khi đo baseline (QA-01) và cần xác nhận trước khi chạy pilot.

---

[Assignment 1](Assignment-1) · [Home](Home)
