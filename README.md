# 🌟 ARIA AI ASSISTANT — NEON POSTGRESQL & VERCEL DEPLOYMENT

> Hệ thống trợ lý AI thông minh toàn diện với giao diện hiện đại, bảng quản trị Admin Panel, đồng bộ cấu hình **API Key** và **Base URL** bằng SQL trên database miễn phí của **[Neon](https://neon.com/)** (`PostgreSQL Serverless`), tối ưu hóa 100% để triển khai lên **Vercel Serverless Functions**.

---

## 📑 MỤC LỤC
1. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
2. [Bước 1: Tạo Database miễn phí trên Neon](#-bước-1-tạo-database-miễn-phí-trên-neon)
3. [Bước 2: Chạy thử nghiệm Local](#-bước-2-chạy-thử-nghiệm-local)
4. [Bước 3: Triển khai lên Vercel](#-bước-3-triển-khai-lên-vercel)
   - [Cách 1: Deploy nhanh bằng Vercel CLI (Khuyên dùng)](#cách-1-deploy-nhanh-bằng-vercel-cli)
   - [Cách 2: Push GitHub & Import vào Vercel](#cách-2-push-github--import-vào-vercel)
5. [Bước 4: Cấu hình biến môi trường trên Vercel](#-bước-4-cấu-hình-biến-môi-trường-trên-vercel)
6. [Quản trị & Sử dụng qua Admin Panel](#-quản-trị--sử-dụng-qua-admin-panel)

---

## 🏛 KIẾN TRÚC HỆ THỐNG

```
                          ┌──────────────────────────┐
                          │     Neon PostgreSQL      │
                          │   (https://neon.com/)    │
                          │   Bảng: aria_settings    │
                          └─────────────┬────────────┘
                                        │ SQL (JSONB)
                                        ▼
    ┌───────────────────────────────────────────────────────────┐
    │                      VERCEL SERVERLESS                    │
    │  • /api/config   : GET/POST đồng bộ API Key & Base URL   │
    │  • /api/test-db  : Kiểm tra kết nối SQL & đo độ trễ       │
    │  • /api/chat     : Serverless Proxy SSE Streaming        │
    └─────────────────────┬───────────────────────┬─────────────┘
                          │                       │
                          ▼                       ▼
               ┌─────────────────────┐ ┌─────────────────────┐
               │    ARIA Chat UI     │ │     Admin Panel     │
               │    (index.html)     │ │    (admin.html)     │
               └─────────────────────┘ └─────────────────────┘
```

- **Bảo mật tuyệt đối**: API Key và Base URL được lưu an toàn trong bảng SQL `aria_settings` trên Neon. Khi chat, `/api/chat` đóng vai trò proxy serverless lấy key từ Neon để gửi request upstream, tránh lộ API Key ở frontend và khắc phục hoàn toàn lỗi CORS.
- **Tự động khởi tạo bảng SQL**: Hệ thống tự động tạo bảng `aria_settings` bằng câu lệnh SQL chuẩn ngay lần kết nối đầu tiên:
  ```sql
  CREATE TABLE IF NOT EXISTS aria_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```

---

## 🚀 BƯỚC 1: TẠO DATABASE MIỄN PHÍ TRÊN NEON

1. Truy cập **[https://neon.com/](https://neon.com/)** (hoặc [https://neon.tech/](https://neon.tech/)) và chọn **Sign Up** (đăng nhập bằng Google hoặc GitHub).
2. Nhấn **Create a project**:
   - Project Name: `aria-db` (hoặc tên tuỳ thích).
   - Database Name: `neondb` (mặc định).
   - Region: Chọn vùng gần bạn nhất (ví dụ: `ap-southeast-1` Singapore hoặc `us-east-2`).
3. Sau khi tạo xong, ở màn hình **Dashboard** hoặc nút **Connect**, bạn sẽ thấy chuỗi kết nối:
   - Chọn định dạng: **Connection string** (Postgres / psql).
   - Chọn chế độ: **Pooled connection** (khuyên dùng cho Serverless) hoặc Direct.
   - Chuỗi có dạng:
     ```text
     postgresql://neondb_owner:npg_xxxxxxxxx@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
4. Copy toàn bộ chuỗi này để dùng cho bước cấu hình tiếp theo.

---

## 💻 BƯỚC 2: CHẠY THỬ NGHIỆM LOCAL

1. Mở terminal tại thư mục dự án và tạo file `.env`:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và dán chuỗi kết nối Neon vừa copy:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_xxxxxxxxx@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Chạy dev server mô phỏng Vercel Serverless:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt:
   - Chat UI: `http://localhost:3000/`
   - Admin Panel: `http://localhost:3000/admin.html` (Mật khẩu mặc định: `admin123`)
5. Vào tab **API Config** trong Admin Panel, click nút **Kiểm tra kết nối Neon** để xác nhận kết nối SQL thành công!

---

## ☁️ BƯỚC 3: TRIỂN KHAI LÊN VERCEL

### Cách 1: Deploy nhanh bằng Vercel CLI (Khuyên dùng)

1. Mở PowerShell hoặc Terminal tại thư mục dự án.
2. Chạy lệnh deploy:
   ```bash
   npx vercel
   ```
3. Đăng nhập và xác nhận theo các câu hỏi của Vercel:
   - `Set up and deploy?` -> gõ `y`
   - `Which scope do you want to deploy to?` -> chọn tài khoản cá nhân của bạn
   - `Link to existing project?` -> gõ `n`
   - `What's your project's name?` -> giữ mặc định hoặc đặt tên `aria-assistant`
   - `In which directory is your code located?` -> giữ `./` (nhấn Enter)
   - `Want to modify settings?` -> gõ `n`
4. Deploy lên môi trường Production:
   ```bash
   npx vercel --prod
   ```

---

### Cách 2: Push GitHub & Import vào Vercel

1. Khởi tạo Git và commit toàn bộ mã nguồn:
   ```bash
   git init
   git add .
   git commit -m "feat: synchronize ARIA project with Neon PostgreSQL and Vercel serverless"
   ```
2. Tạo một Repository mới trên GitHub của bạn.
3. Liên kết và đẩy code lên GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
4. Đăng nhập vào [https://vercel.com/](https://vercel.com/), chọn **Add New...** -> **Project** -> Chọn Repository GitHub vừa tạo -> Nhấn **Deploy**.

---

## 🔑 BƯỚC 4: CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL

Để backend Vercel Serverless kết nối được vào database Neon, bạn cần thêm biến môi trường `DATABASE_URL`:

### Thêm trên Vercel Web Dashboard:
1. Vào trang dự án trên Vercel: **Settings** -> **Environment Variables**.
2. Thêm biến:
   - **Key**: `DATABASE_URL`
   - **Value**: Dán chuỗi kết nối Neon của bạn (`postgresql://...`)
   - **Environments**: Tích chọn cả **Production**, **Preview**, **Development**.
3. Nhấn **Save**.
4. Vào tab **Deployments** trên Vercel -> Chọn menu 3 chấm `...` ở bản deploy mới nhất -> Chọn **Redeploy** để Vercel nạp biến môi trường mới.

### (Tuỳ chọn) Thêm trực tiếp bằng Vercel CLI:
```bash
npx vercel env add DATABASE_URL production
# Nhập chuỗi postgresql://... khi được hỏi
npx vercel --prod
```

---

## 🎛 QUẢN TRỊ & SỬ DỤNG QUA ADMIN PANEL

1. Truy cập đường dẫn: `https://ten-du-an-cua-ban.vercel.app/admin.html`
2. Mật khẩu đăng nhập mặc định: `admin123` *(bạn có thể đổi mật khẩu tại tab Bảo mật)*.
3. Tại tab **API Config**:
   - **Neon Database**: Xem trạng thái kết nối SQL trực tiếp, độ trễ và tên database.
   - **Custom API Key & Base URL**:
     - Bật công tắc **Sử dụng Custom API**.
     - Nhập **Base URL** (ví dụ: `https://api.openai.com/v1`, OpenRouter, Groq, DeepSeek, Google Gemini OpenAI-compatible...).
     - Nhập **API Key**.
     - Chọn hoặc nhập **Model ID** (ví dụ: `gpt-4o`, `deepseek-chat`, `claude-3-5-sonnet`, `gemini-1.5-flash`).
     - Nhấn **Lưu cấu hình**: Cấu hình sẽ tự động đồng bộ tức thì lên Neon PostgreSQL.
   - **Kiểm tra API**: Nhấn **Kiểm tra kết nối** để gửi tin nhắn test trực tiếp.
4. Tại tab **System Prompt**:
   - Cài đặt tính cách, hướng dẫn hệ thống cho ARIA.
   - Hỗ trợ lưu trữ nhiều preset prompt, tự động đồng bộ vào bảng SQL trên Neon.
5. Tại trang chủ **Chat UI** (`/`):
   - Nhắn tin tương tác mượt mà với hiệu ứng streaming từng từ (SSE).
   - Tự động lấy API Key và Base URL từ Neon DB qua endpoint `/api/chat` mà không sợ lộ key.
