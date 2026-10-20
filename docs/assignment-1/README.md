# DutyLog — Chuẩn bị nộp Assignment 1

Đã tìm thấy báo cáo 39 trang tại **`report/main.pdf`**, cùng bộ nguồn LaTeX trong `report/`. Giữ nguyên vị trí và tên file này.
Đặt minh chứng nghiên cứu đã ẩn thông tin cá nhân trong thư mục [`evidence/`](evidence/).

Đây là hướng dẫn chuẩn bị. Chỉ có các file trong máy chưa tạo thành bài nộp công khai.

## 1. Đưa tài liệu local lên repository

Đã chuẩn bị trang đầu Assignment 1 và 12 trang Markdown từ báo cáo trong `wiki/A1-*.md`. Sau khi bổ sung minh chứng thật, chạy từ thư mục gốc DutyLog:

```bash
git status --short
git add README.md docs/assignment-1/ report/ wiki/Home.md wiki/Assignment-1.md wiki/_Sidebar.md wiki/A1-*.md
git diff --cached --stat
git commit -m "docs: prepare Assignment 1 submission materials"
git push origin main
```

Nếu repository yêu cầu pull request, đưa các thay đổi lên nhánh riêng và merge vào `main` trước khi nộp. Kiểm tra các file đã stage trước khi commit.

Hoặc mở repository trên GitHub, chọn **Add file → Upload files**, kéo thư mục `report/` vào và lưu thay đổi. Cách này chỉ đưa các file được chọn lên; các trang Markdown local vẫn cần được upload hoặc push riêng.

Link PDF sau khi file đã có trên nhánh `main`:

<https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/report/main.pdf>

## 2. Đăng GitHub Wiki

**Thư mục `wiki/` trong repository và GitHub Wiki là hai nơi riêng biệt.** Push repository chính không tự đăng các trang lên Wiki.

1. Vào repository → **Settings → General → Features**, bật **Wikis** nếu đang tắt.
2. Mở tab **Wiki**. Nếu chưa có Wiki, tạo và lưu trang **Home** đầu tiên.
3. Tạo trang có tiêu đề **Assignment-1**, dán nội dung từ [`../../wiki/Assignment-1.md`](../../wiki/Assignment-1.md) rồi lưu.
4. Sửa **Home** theo [`../../wiki/Home.md`](../../wiki/Home.md); thêm mục Assignment 1 vào sidebar theo [`../../wiki/_Sidebar.md`](../../wiki/_Sidebar.md).
5. Đăng 12 trang `wiki/A1-*.md` với tiêu đề đúng tên file bỏ đuôi `.md`, cùng các trang kỹ thuật được Home/sidebar dẫn đến nếu chúng chưa có trên Wiki. Dùng Git theo hướng dẫn dưới đây sẽ đăng tất cả các trang cùng lúc.

Nếu muốn đăng bằng Git sau khi đã tạo trang đầu tiên:

```bash
# Chạy từ thư mục gốc DutyLog; dùng một thư mục đích chưa tồn tại.
git clone git@github.com:Big-Data-Club/BDCHub---DutyLog.wiki.git ../dutylog-assignment-wiki
cp wiki/*.md ../dutylog-assignment-wiki/
git -C ../dutylog-assignment-wiki diff --stat
git -C ../dutylog-assignment-wiki add -- '*.md'
git -C ../dutylog-assignment-wiki diff --cached --stat
git -C ../dutylog-assignment-wiki commit -m "docs: publish Assignment 1 entry point"
git -C ../dutylog-assignment-wiki push origin HEAD
```

Xem diff trước khi commit: các file trùng tên trong Wiki sẽ nhận nội dung từ local. GitHub chỉ hiển thị nội dung Wiki trên nhánh mặc định; dùng nhánh mặc định vừa clone.

## 3. Hoàn thiện nội dung trước khi nộp

- [x] `report/main.pdf` tồn tại local, đọc được và có 39 trang.
- [x] Đã chuyển 13 phần LaTeX thành 12 trang Wiki Markdown, gồm hai luồng Mermaid, và liên kết từ trang `Assignment-1`.
- [x] `main.pdf` đã truy cập công khai; bản đã đăng khớp file local tại lần kiểm tra đầu tiên ngày 20/10/2026.
- [ ] Đã đăng các trang Product Discovery lên GitHub Wiki và kiểm tra bảng, sơ đồ, nội dung trên trang công khai.
- [ ] Đã bổ sung dữ liệu khảo sát, bảng câu hỏi và minh chứng thật trong `evidence/`, cập nhật mục lục minh chứng.
- [ ] Mọi thành viên đã tham gia GitHub Organization; bổ sung danh sách nhóm và tài khoản GitHub từ thông tin thật.
- [x] Đã xác minh [DutyLog Project Board](https://github.com/orgs/Big-Data-Club/projects/3) trả về HTTP 200 khi không đăng nhập. Đã sửa URL cũ trả về 404 trong nguồn LaTeX, link PDF và các trang Wiki; cần push bản sửa nếu chưa đăng.
- [ ] Board có công việc thật, trạng thái và người phụ trách phù hợp.
- [ ] Link Figma Make đã thêm vào Home và Assignment 1; kiểm tra người có link xem được mà không cần tài khoản nhóm.
- [ ] Đã cập nhật trạng thái chuẩn bị trên trang `Assignment-1` theo kết quả kiểm tra thực tế.
- [ ] Mở cửa sổ ẩn danh, kiểm tra Home → Assignment 1 → PDF, tài liệu Wiki, Organization, Project Board và minh chứng; tất cả đều xem được mà không đăng nhập.

## 4. Nộp BK-LMS

Sau khi các mục trên đã hoàn thành, một thành viên đại diện nộp **một link**:

<https://github.com/Big-Data-Club/BDCHub---DutyLog/wiki>

Nếu BK-LMS vẫn báo thuộc nhiều nhóm, nhờ giảng viên điều chỉnh hoặc để thành viên cùng nhóm có quyền nộp hợp lệ đại diện nộp. Trạng thái LMS cần được kiểm tra trực tiếp trên tài khoản; hướng dẫn này không xác nhận bài đã nộp.

Theo thông tin đề bài bạn cung cấp, hạn nộp là **23:59 ngày 20/10/2026**; kiểm tra lại thời hạn hiển thị trên BK-LMS.

## Hướng dẫn GitHub chính thức

- [Thêm file local vào repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Tạo, sửa và đăng các trang Wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages)
- [Đặt Project ở chế độ công khai](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects)
