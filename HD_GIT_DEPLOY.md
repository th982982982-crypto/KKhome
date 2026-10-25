# HƯỚNG DẪN PULL, PUSH & DEPLOY THEO TOKEN TRONG FILE .ENV — KK HOME

Tài liệu này hướng dẫn cách cấu hình, bảo mật và sử dụng **GitHub Personal Access Token (PAT)** được lưu trữ an toàn trong file `.env` để thực hiện các thao tác **Pull (kéo code)**, **Push (đẩy code)** và **Deploy (triển khai tự động)** cho dự án **KKhome**.

---

## 1. Cấu Hình Token Trong File `.env`

Token GitHub được lưu trữ an toàn tại file [`.env`](file:///.env) ở thư mục gốc (không commit lên git):

```env
# ==============================================================================
# GITHUB CONFIGURATION & DEPLOYMENT TOKEN - KK HOME
# ==============================================================================
# GitHub Personal Access Token (PAT)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Repository Information
GITHUB_REPO_OWNER=th982982982-crypto
GITHUB_USERNAME=th982982982-crypto
GITHUB_REPO_NAME=KKhome
GITHUB_REPO_URL=https://github.com/th982982982-crypto/KKhome.git
GITHUB_AUTH_URL=https://ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@github.com/th982982982-crypto/KKhome.git

# Deployment Branch
DEPLOY_BRANCH=main
```

> [!IMPORTANT]
> **Bảo Mật Tuyệt Đối:**
> - File [`.env`](file:///.env) **đã được cấu hình trong [`.gitignore`](file:///.gitignore)** (dòng `.env*`).
> - Token cá nhân sẽ **KHÔNG bao giờ bị vô tình commit hoặc lộ lên GitHub**.
> - Không xóa hoặc chỉnh sửa dòng `.env*` trong `.gitignore`.

---

## 2. Thao Tác Nhanh Bằng Script PowerShell (`sync-git.ps1`)

Đã có sẵn script tự động hóa [`sync-git.ps1`](file:///sync-git.ps1). Script sẽ tự động đọc biến `GITHUB_TOKEN` và `GITHUB_REPO_URL` từ file `.env`:

### 2.1. Kéo code mới nhất từ nhánh `main` (Pull)
Mỗi khi bắt đầu làm việc hoặc muốn cập nhật code mới nhất từ GitHub:
```powershell
.\sync-git.ps1 pull
```
*Lệnh này sẽ tự động kết nối remote `https://github.com/th982982982-crypto/KKhome.git` bằng token và cập nhật nhánh `main`.*

---

### 2.2. Đẩy code lên nhánh `main` (Push & Auto-Deploy)
Khi bạn chỉnh sửa xong mã nguồn, thêm tính năng hoặc biểu mẫu mới:
```powershell
.\sync-git.ps1 push "Mô tả nội dung cập nhật tại đây"
```
*Script sẽ tự động thực hiện: `git add .` -> `git commit -m "..."` -> `git push` lên nhánh `main`.*
*Hệ thống CI/CD (Vercel) sẽ tự động bắt sự kiện commit và kích hoạt bản dựng Deploy lên trang chính thức.*

---

### 2.3. Cài đặt Remote Origin tự động (Setup)
Nếu bạn muốn dùng các lệnh git chuẩn (`git pull`, `git push`) trực tiếp trong terminal mà không cần gõ qua script:
```powershell
.\sync-git.ps1 setup
```
Sau đó bạn có thể gõ trực tiếp:
```powershell
git pull
git push
```

---

### 2.4. Kiểm tra trạng thái Git
```powershell
.\sync-git.ps1 status
```

---

## 3. Thao Tác Bằng Lệnh Git Thủ Công (Manual)

Nếu không sử dụng script, bạn có thể chạy trực tiếp bằng Git CLI:

### Gán Remote có xác thực Token:
```powershell
git remote set-url origin https://<GITHUB_TOKEN>@github.com/th982982982-crypto/KKhome.git
```

### Kéo code:
```powershell
git pull origin main
```

### Đẩy code & kích hoạt Deploy:
```powershell
git add .
git commit -m "feat: cap nhat tinh nang moi"
git push origin main
```

---

## 4. Quy Trình Cập Nhật Khi Token Hết Hạn
Khi token bị hết hạn hoặc bạn đổi token mới:
1. Mở file [`.env`](file:///.env).
2. Thay thế giá trị của `GITHUB_TOKEN=ghp_TOKEN_MOI`.
3. Chạy lệnh:
   ```powershell
   .\sync-git.ps1 setup
   ```
   Script sẽ tự động cập nhật URL remote mới nhất!
