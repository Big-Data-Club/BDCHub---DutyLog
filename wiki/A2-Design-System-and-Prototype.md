# A2 · Design System & Interactive Prototype Guide

> Các token màu sắc, kiểu chữ và thành phần dưới đây được đồng bộ giữa thiết kế và mã nguồn giao diện tại [`mobile/src/ui/theme.ts`](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/mobile/src/ui/theme.ts) và [`mobile/src/ui/Kit.tsx`](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/mobile/src/ui/Kit.tsx).

---

## 1. Visual Identity

- **Tên sản phẩm:** DutyLog (thuộc hệ sinh thái BDC Hub — Big Data Club, HCMUT).
- **Phong cách thị giác:** Gọn gàng, tương phản rõ, ưu tiên khả năng quét nhanh thông tin trạng thái (Status-first) trong môi trường phòng sinh hoạt đông người.
- **Nhận diện thương hiệu:** Logo Big Data Club kết hợp wordmark **Duty** (`#111A2E`) + **Log** (`#2860EE`).

---

## 2. Color Tokens

| Nhóm | Token | Mã màu (Hex) | Mục đích sử dụng |
|---|---|---|---|
| **Brand / Primary** | `blue` | `#2860EE` | Hành động chính (CTA), tab đang chọn, liên kết, nút Quét trung tâm |
| | `blueDark` | `#1948D3` | Trạng thái nhấn / điểm nhấn đậm |
| | `blueWash` | `#ECF3FF` | Nền badge, icon container, hộp thông báo thông tin |
| **Neutral / Surface** | `ink` | `#111A2E` | Tiêu đề, văn bản chính, số đồng hồ ca trực |
| | `muted` | `#647997` | Văn bản phụ, siêu dữ liệu (MSSV, thời gian, cơ sở) |
| | `faint` | `#91A2BA` | Nhãn tab chưa chọn, trạng thái vô hiệu hóa |
| | `bg` | `#F2F4F8` | Nền trang tổng thể |
| | `white` | `#FFFFFF` | Nền Card, Bottom Bar, thanh điều hướng |
| | `line` | `#DBE4F0` | Đường kẻ phân cách, viền nút outline & input |
| **Semantic** | `green` / `greenWash` | `#16A34A` / `#EEFBF3` | Đang trực, thành viên hợp lệ, vào phòng, ca còn chỗ |
| | `orange` / `orangeWash` | `#F59E0B` / `#FFF8E7` | Rời phòng, cảnh báo mạng/dữ liệu chưa đầy đủ |
| | `red` / `redWash` | `#E73C45` / `#FFF1F2` | Cảnh báo ngoài tổ chức, lỗi xác thực, hành động kết thúc/hủy |

---

## 3. Typography, Iconography & Layout Rules

- **Typography Scale:**
  - `Timer / Hero Metric`: `40px`, Bold (`900`), `letterSpacing: -1.4`
  - `Page Title`: `24px`, ExtraBold (`800`)
  - `Section Headline`: `17–19px`, ExtraBold (`800`)
  - `Card / Heading`: `15px`, ExtraBold (`800`)
  - `Body`: `14px`, SemiBold (`600`)
  - `Muted / Meta`: `12–13px`, Regular (`lineHeight: 18–19px`)
  - `Eyebrow / SmallLabel / Chip`: `10px`, ExtraBold (`800`), `letterSpacing: 1.2–1.3`
- **Iconography:** Bộ icon **Lucide** (`lucide-react-native`), nét chuẩn `1.9–2.4px`, kích thước đồng nhất `14 / 18 / 21 / 28px`.
- **Layout & Spacing:**
  - Horizontal page padding: `18–19px`
  - Card padding: `18px`, border-radius: `21px`
  - Button border-radius: `14px`, `minHeight: 48px` (`compact: 42px`)
  - Bottom Tab Bar height: `76px`, nút `Quét` trung tâm `53×53px` nâng nổi (`marginTop: -30px`, viền trắng `3px`).

---

## 4. Reusable UI Components & Variants

| Component | Variants / States | Ứng dụng chính |
|---|---|---|
| `ActionButton` | `Primary`, `Outline`, `Danger`, `Compact`, `Disabled` (hỗ trợ icon trái) | Đăng ký ca, Quét điểm danh, Kết thúc ca, Thử lại |
| `Card` | `Default`, `Active Highlight` (viền xanh `#ACE2C2`), `Selectable` (viền xanh `#2860EE` + tick) | Hero ca trực, chọn phòng, chọn ca, danh sách hoạt động |
| `Chip` | `blue`, `green`, `orange`, `red`, `gray` | Vào phòng, Rời phòng, Còn chỗ, Đã đầy, Sức chứa phòng |
| `Tabs` (Bottom Bar) | `Default`, `Selected`, `Raised Center CTA (SCAN)` | Điều hướng chính toàn ứng dụng |
| `HeaderBack` | Eyebrow + Title + Circular Back Button (`42×42px`) | Luồng Đăng ký ca 4 bước, Chọn phòng, Quét, QR |
| `Empty` & `Spinner` | Icon + Title + Subtitle / ActivityIndicator + Status text | Trạng thái rỗng & đang tải trên mọi màn hình |

---

## 5. Interactive Prototype Guide (Dành cho người đánh giá)

- **Link Interactive Prototype:** [Mở DutyLog Prototype trên Figma](https://www.figma.com/make/edHYn86d06Uh95uwZJ1Wqm/DutyLog?fullscreen=1&t=mm4kpDhtha3xpPrq-1&code-node-id=0-6)

### Các kịch bản kiểm thử chính trên Prototype
1. **Kịch bản 1 — Xem trạng thái phòng & đổi phòng:** Từ `Trang chủ` → nhấn `Đổi phòng` → chọn giữa 3 phòng (`605 C6`, `303 B9`, `710 H6`) → quan sát trạng thái phòng và hoạt động gần đây.
2. **Kịch bản 2 — Đăng ký ca trực 4 bước:** Từ `Trang chủ` hoặc tab `Ca trực` → nhấn `Đăng ký ca trực` → đi qua 4 bước (`Tổ chức` → `Phòng & Ngày` → `Ca trực` → `Xác nhận`) → xem màn hình xác nhận thành công.
3. **Kịch bản 3 — Quét điểm danh & xử lý dự phòng:** Nhấn nút `Quét` ở giữa Bottom Bar → chuyển đổi chế độ quét Barcode / QR hoặc nhập MSSV thủ công → xem phản hồi hợp lệ / cảnh báo.
4. **Kịch bản 4 — Mã QR cá nhân:** Từ `Trang chủ` (`Mã QR của tôi`) hoặc tab `Cá nhân` → mở mã QR xoay vòng 10 giây.

---

[Assignment 2](Assignment-2) · [Updated User Flows & States](A2-User-Flows-and-States) · [Usability Testing & Iterations](A2-Usability-Testing-and-Iterations)
