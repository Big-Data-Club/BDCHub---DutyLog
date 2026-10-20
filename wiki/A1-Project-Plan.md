> Chuyển từ báo cáo Assignment 1 của nhóm; giữ các giới hạn bằng chứng và phân biệt kế hoạch với kết quả thực tế.
> Nguồn: [13_plan_traceability.tex](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/sections/13_plan_traceability.tex) · [PDF đầy đủ](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf).

# Kế hoạch dự án và liên kết công việc

## Nền tảng dự án

| Kho mã nguồn (DutyLog) | [Mở kho mã nguồn](https://github.com/Big-Data-Club/BDCHub---DutyLog) |
| --- | --- |
| GitHub Organization | [Mở tổ chức GitHub](https://github.com/Big-Data-Club) |
| GitHub Project | [Mở GitHub Project](https://github.com/orgs/Big-Data-Club/projects/3) |
| GitHub Wiki | [Mở GitHub Wiki](https://github.com/Big-Data-Club/BDCHub---DutyLog/wiki) |
| Kế hoạch kỹ thuật | Tệp *DutyLog 2.0 Product Engineering Roadmap* |
| Biểu mẫu/bộ câu hỏi khảo sát gốc<br>(dữ liệu thô, cần ẩn email trước khi công bố) | [Google Sheet khảo sát do nhóm cung cấp](https://docs.google.com/spreadsheets/d/1R5b7StzAAhT9WhOII3t3W2ZHKKUwrysQPayB1g6tjMU/edit?usp=sharing) |

GitHub Project dùng luồng *Backlog → To Do → In Progress → Review → Done*. Task được lấy từ roadmap kỹ thuật; chỉ các task phục vụ F1--F7 nằm ở To Do hoặc In Progress, các task còn lại giữ ở Backlog (mục 12.2).

## Các mốc công việc và phân công

**Cơ sở lập kế hoạch.** Roadmap kỹ thuật gốc gồm 106 task, 216 ngày công cho phạm vi mở rộng, tính cho 7 người × 4 ngày hiệu dụng mỗi tuần. Nhóm có 5 thành viên (khoảng 20 ngày công mỗi tuần theo cùng giả định) và MVP chỉ gồm F1--F7, nên chỉ chọn 32 task của roadmap phục vụ F1--F7 (kể cả task tiên quyết), cộng 4 task mới chưa có trong roadmap (NEW-01 đến NEW-04). Tổng 32 task roadmap là 59,5 ngày công, cộng 4 task mới (NEW-01 đến NEW-04) là 9 ngày công, tổng cộng 68,5 ngày công. Mốc thời gian lấy theo tuần W0--W8 của roadmap (W0 bắt đầu 12/10/2026) và sẽ điều chỉnh theo hạn nộp Assignment 1: 20/10/2026.

**Quan hệ với phiên bản hiện có.** Một phần các chức năng F1--F3 và F7 đã có trong phiên bản DutyLog hiện tại (mục 6); các task bên dưới là phần cần kiểm kê, sửa hoặc bổ sung, nên trạng thái “Review”/“Đang làm” của một số task phản ánh mã đã viết sẵn. Task F-02 (kiểm kê API) là bước xác định phần nào còn thiếu.

**Task ngoài MVP (giữ ở Backlog).** Đăng ký, hủy và đổi ca (BE-01 đến BE-08, MB-03, MB-04); chế độ offline (BE-14, BE-15, MB-07); outbox, Kafka, thông báo đẩy và bảng trực tiếp (BE-16 đến BE-19, QR-04 đến QR-14); CI/CD nâng cao (CI-04 đến CI-16); kiểm thử tải và chaos (QA-02 đến QA-09). Một số hạng mục này đã có mã viết sẵn ở trạng thái Review (chưa chạy, chưa merge) nhưng không tính vào MVP cho đến khi có bằng chứng nhu cầu (mục 7.2).

**Phân công theo phần báo cáo.**

| **Thành viên** | **MSSV** | **Phụ trách (yêu cầu đề / mục báo cáo)** |
| --- | --- | --- |
| Nguyễn Phúc Nhân | 2312438 | 2.1 Định hướng dự án (mục 1); 2.12 Nền tảng và kế hoạch dự án (mục 12) |
| Nguyễn Chu Hải Nam | 2312168 | 2.9 MVP và ưu tiên (mục 9); 2.10 User Stories (mục 10); 2.11 Luồng người dùng (mục 11) |
| Huỳnh Anh Chí Kiệt | 2013563 | 2.3 Giả định quan trọng (mục 3); 2.4 Kế hoạch bằng chứng (mục 4) |
| Nguyễn Văn Công Thành | 2313133 | 2.5 Nghiên cứu người dùng và thị trường (mục 5); 2.7 Đánh giá bằng chứng (mục 7) |
| Nguyễn Trần Trung Kiên | 2411759 | 2.2 Lý do chọn nền tảng di động (mục 2); 2.6 Giải pháp hiện có (mục 6); 2.8 Business Canvas (mục 8) |

Phân công vai trò kỹ thuật trong các bảng M1--M4: Tech Lead: Nguyễn Phúc Nhân; Backend / Data: Huỳnh Anh Chí Kiệt; Mobile: Nguyễn Văn Công Thành; Product/UX: Nguyễn Chu Hải Nam; DevOps/SRE, QA/Perf & Security: Nguyễn Trần Trung Kiên. Với task có hai vai trò (ví dụ “Mobile + Backend”), vai trò đứng trước là người chịu trách nhiệm chính.

**Tải công việc theo vai trò (ngày công, tính cả task chung cho người chịu trách nhiệm chính):** Tech Lead ≈ 6 (kể cả NEW-04); Backend/Data ≈ 14,5 (kể cả QR-01); Mobile ≈ 21 (kể cả NEW-01 và NEW-03); Product/UX 14,5; DevOps/QA/Security 12,5. Mobile là vai trò nặng nhất và nằm trên đường găng của F3, nên Tech Lead nhận NEW-04 và hỗ trợ review/tích hợp API cho MB-01, NEW-01, NEW-03; tải được cập nhật trên GitHub Project ở đầu M2.

**M0 -- Hoàn thiện báo cáo Assignment 1** (19/10/2026): các mục 1--12 theo bảng phân công ở trên, kiểm tra liên kết GitHub trước khi nộp.

**M1 -- Khóa baseline và nền tảng an toàn (W0--W1, 12/10--25/10/2026).** Điều kiện hoàn thành: baseline và contract API được lưu trong Git; ghi nhận (check-in/check-out) yêu cầu JWT, kiểm tra quyền theo tổ chức/phòng, và không ghi trùng khi gửi lại.

| **ID** | **Công việc** | **Chức năng** | **Phụ trách** | **Ngày** | **Trạng thái** |
| --- | --- | --- | --- | --- | --- |
| F-01 | Khóa baseline và tag trước khi sửa | Nền tảng | Tech Lead | 0,5 | Chưa làm |
| F-02 | Inventory: API thực tế so với tài liệu | Nền tảng | Tech Lead | 1 | Đang làm |
| F-03 | Đóng băng API contract v1 hiện tại | Nền tảng | Tech Lead | 1 | Chưa làm |
| F-04 | Định nghĩa FSM presence và shift | F2, F3, F6 | Tech Lead | 1 | Đang làm |
| F-05 | Phân định ownership dữ liệu và namespace | F1 | Tech Lead | 0,5 | Chưa làm |
| F-07 | Xác định kích thước tải thực | Nền tảng | Tech Lead | 1 | Chưa làm |
| CI-01 | Audit GitHub Actions ở hai repo | Chung | DevOps/SRE | 1 | Cần xác minh |
| CI-02 | Go lint, unit test, race, vet | Chung | DevOps/SRE | 1,5 | Chưa làm |
| CI-03 | Mobile typecheck, lint, unit test | Chung | DevOps/SRE | 1,5 | Đang làm |
| BE-09 | Bắt buộc JWT ở thao tác ghi | F1, F3 | Backend | 2 | Cần xác minh |
| BE-10 | Phân quyền theo tổ chức/phòng cho người trực | F1, F3 | Backend | 2 | Chưa làm |
| BE-12 | Idempotency cho check-in/check-out | F3, F4 | Backend | 2,5 | Chưa làm |
| BE-13 | Nguồn chân lý DB và nhất quán Redis | F7 | Backend | 2 | Cần xác minh |
| QR-01 | Truy vết đường quét: camera → API → DB → Redis | F3 | Backend + Data | 2 | Cần xác minh |
| QA-01 | Đo baseline máy quét trên thiết bị thật | F3 | QA/Perf | 2 | Chưa làm |
| UX-01 | Phỏng vấn thành viên và ca trưởng (mở rộng sang ban chủ nhiệm cho A7) | F7 | Product/UX | 2 | Chưa làm |

**M2 -- Thiết kế được kiểm chứng và luồng chính (W2--W3, 26/10--08/11/2026).** Điều kiện hoàn thành: người dùng thực hiện được đăng nhập, bắt đầu ca và quét một thành viên trên prototype hoặc bản chạy được; kết quả usability test được ghi lại.

| **ID** | **Công việc** | **Chức năng** | **Phụ trách** | **Ngày** | **Trạng thái** |
| --- | --- | --- | --- | --- | --- |
| BE-11 | Bảo mật token QR và chống replay | F3, F5 | Backend | 2 | Cần xác minh |
| UX-02 | Quan sát ca trực tại 3 phòng (605 C6, B9, 710 H6) | F3, F7 | Product/UX | 2 | Chưa làm |
| UX-03 | Sitemap và điều hướng | F2, F7 | Product/UX | 1,5 | Review |
| UX-04 | Review prototype theo flow | F1--F7 | Product/UX | 2 | Đang làm |
| UX-12 | Design tokens và component library | Chung | Product/UX | 2,5 | Review |
| UX-05 | Usability test 5 người trên prototype | F3 | Product/UX | 2,5 | Chưa làm |
| UX-06 | Trạng thái loading/empty/error/permission | F3, F4 | Product/UX | 2 | Đang làm |
| MB-01 | Đăng nhập, giữ auth contract | F1 | Mobile | 2 | Review |
| MB-02 | Màn Trang chủ và điều hướng; hiển thị trạng thái phòng | F2, F7 | Mobile | 3 | Review |
| MB-05 | Màn quét và khung camera | F3, F4 | Mobile | 3 | Chưa làm |
| NEW-01 | Nhập MSSV thủ công, đánh dấu bản ghi “nhập thủ công” | F4 | Mobile + Backend | 3 | Chưa làm |
| NEW-04 | Nhập lịch ca ban đầu cho pilot (import CSV hoặc seed) và quy định người chịu trách nhiệm nhập lịch | F2 | Tech Lead | 1 | Chưa làm |

**Cổng quyết định G1 (cuối M2, 08/11/2026).** Dựa trên kết quả phỏng vấn (UX-01), quan sát ca trực (UX-02), thử nguyên mẫu (UX-05) và phân tích dữ liệu nhóm chat (mục 4.3), nhóm áp dụng tiêu chí ở mục 4.5 để kết luận A1. *Support*: tiếp tục M3 đầy đủ. *Challenge* (người dùng chỉ cần biết phòng mở/đóng và ai đang trực, không cần danh sách người có mặt): thu hẹp MVP về F1, F2 và F7 rút gọn (trạng thái mở/đóng theo ca của F2, người trực, lịch ca kế tiếp và thay đổi lịch; bỏ danh sách người có mặt) và hoãn luồng quét F3, F4, F5, F6. *Unresolved*: sửa nguyên mẫu và thử lại trước khi đầu tư thêm cho F3. Các task F3 nặng (MB-05, MB-06, QA-01) vì vậy chỉ nên hoàn thiện sau G1; trước G1 chỉ làm phần chung với F4 và nền tảng.

**M3 -- Hoàn thiện MVP (W4--W6, 09/11--29/11/2026).** Điều kiện hoàn thành: đủ F1--F7 chạy được trên thiết bị thật; lỗi quét hoặc mất mạng hiển thị rõ, không báo thành công giả.

| **ID** | **Công việc** | **Chức năng** | **Phụ trách** | **Ngày** | **Trạng thái** |
| --- | --- | --- | --- | --- | --- |
| MB-06 | Thông báo kết quả quét với trạng thái minh bạch | F3 | Mobile | 2 | Chưa làm |
| MB-08 | QR cá nhân: tự làm mới, đếm ngược, hết hạn | F5 | Mobile | 2 | Chưa làm |
| NEW-02 | Tự kết thúc ca và tự check-out khi hết giờ | F6 | Backend | 2 | Chưa làm |
| NEW-03 | Trạng thái phòng: ca kế tiếp và thay đổi lịch | F7 | Mobile + Backend | 3 | Chưa làm |
| MB-10 | Kiểm thử màn hình/e2e trên Android và iOS | Chung | Mobile | 3 | Chưa làm |
| QA-10 | Định nghĩa SLO và tiêu chí go/no-go | Chung | QA/Perf | 1,5 | Chưa làm |

**M4 -- Pilot và thu số liệu (W7--W8, 30/11--13/12/2026).** Điều kiện hoàn thành: chạy thử tại 3 phòng (605 C6 và B9 ở Cơ sở 1; 710 H6 ở Cơ sở 2) và thu các số đo của mục 4.5 (độ chính xác danh sách người có mặt, tỷ lệ ca có ghi nhận, thời gian check-in, tần suất mở trạng thái phòng, số lần nhập MSSV thủ công, số ca tự kết thúc).

| **ID** | **Công việc** | **Chức năng** | **Phụ trách** | **Ngày** | **Trạng thái** |
| --- | --- | --- | --- | --- | --- |
| OPS-05 | Runbook sự cố và khôi phục | Chung | SRE + Security | 2 | Chưa làm |
| OPS-09 | Pilot 3 phòng và sign-off | F1--F7 | SRE + Security | 3 | Chưa làm |

## Bảng liên kết từ bằng chứng đến công việc

Mỗi hàng đi từ bằng chứng (mục 7.1) đến task. Đầu vào của bảng là nhu cầu N1--N7 và yêu cầu R1--R6 (mục 10.1), story US1--US8 (mục 10.2), feature F1--F7 (mục 9.3) và hai flow (mục 11).

| **Nguồn thông tin** | **Nhu cầu** | **Yêu cầu** | **Câu chuyện người dùng** | **Chức năng** | **Luồng** | **Công việc** |
| --- | --- | --- | --- | --- | --- | --- |
| Yêu cầu nền tảng (ngoài A1--A7) | --- | R1 | US1 | F1 | 1, 2 | F-05; BE-09; BE-10; MB-01 |
| A1 (7.1) | N1 | R6 | US7 | F7 | 2 | BE-13; MB-02; UX-01 |
| A2 (7.1) | N2 | R2, R5 | US2, US3, US6 | F2, F3, F6 | 1 | F-04; MB-05; MB-06; NEW-02 |
| A3 (7.1) | N3 | R3, R4 | US3, US4, US5 | F3, F4, F5 | 1 | BE-11; BE-12; MB-05; MB-08; NEW-01; QA-01 |
| A4, A5 (7.1) | N4, N7 | R2, R6 | US2, US7 | F2, F7 | 1, 2 | F-04; MB-02; NEW-03; NEW-04 |
| A6 (7.1) | N5 | R4, R5 | US3, US4, US5, US6 | F3, F4, F5, F6 | 1 | NEW-01; NEW-02; MB-06; UX-06; QA-01 |
| A7 (7.1, giả thuyết) | N6 | R6 | US8 | F7 | 2 | UX-01 (mở rộng sang ban chủ nhiệm); MB-02 |
| A1--A7 (kiểm chứng) | --- | --- | --- | F1--F7 | 1, 2 | F-01; F-02; F-03; F-07; CI-01; CI-02; CI-03; QR-01; UX-02; UX-03; UX-04; UX-05; UX-12; MB-10; QA-10; OPS-05; OPS-09 |

---

[Assignment 1](Assignment-1) · [Home](Home)
