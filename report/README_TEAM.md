# Quy tắc làm báo cáo LaTeX (DutyLog – Assignment 1)

- Chỉ sửa file của mình trong `sections/` (xem dòng đầu mỗi file: CHỦ SỞ HỮU).
- `main.tex`, `preamble.tex`, `cover/` chỉ Người 1 sửa. Cần package/macro → nhắn Người 1.
- File trong `sections/` KHÔNG có `\documentclass`/`\begin{document}`; bắt đầu bằng `\section` (hoặc `\subsection` ở file 08).
- Label có tiền tố người viết: `\label{p3:fig-...}`. Ảnh để trong `figures/pX/`, bằng chứng gốc trong `evidence/`.
- Đánh dấu chỗ chưa xong bằng `\todo{...}`; xóa hết `\todo` trước khi nộp.
- Lỗi biên dịch trong file mình → comment đoạn đó lại trước khi để người khác thấy.
- Cần thêm 2 ảnh vào `cover/`: `logoBK.png`, `hcmut.png`.
- Trình biên dịch: pdfLaTeX (+ BibTeX).
