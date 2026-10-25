# Hướng Dẫn Quản Lý Code, Cập Nhật & Deploy Với Token Từ `.env`

Tài liệu này hướng dẫn cách kéo code (`pull`), đẩy code (`push`) và triển khai (`deploy`) dự án **KKhome** lên nhánh `main` trên GitHub sử dụng Personal Access Token (PAT) lưu trong file `.env`.

---

## 1. Cấu Hình Token Trong File `.env`

Token GitHub đã được cấu hình trong file [`.env`](file:///.env) tại thư mục gốc dự án:

```env
# ==========================================
# CẤU HÌNH GITHUB TOKEN (PUSH / PULL / DEPLOY)
# ==========================================
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO_OWNER=th982982982-crypto
GITHUB_REPO_NAME=KKhome
GITHUB_REPO_URL=https://github.com/th982982982-crypto/KKhome.git
```

> [!IMPORTANT]
> **Bảo Mật:** File [`.gitignore`](file:///.gitignore) đã cấu hình quy tắc `.env*`. Do đó, file `.env` chứa token này sẽ **không bao giờ bị vô tình đẩy lên GitHub**. Không xóa dòng `.env*` trong file `.gitignore`.

---

## 2. Cách Thao Tác Nhanh (Dùng Script `sync-git.ps1`)

Đã có sẵn script tự động hóa [`sync-git.ps1`](file:///sync-git.ps1) giúp tự động đọc token từ `.env` và thực hiện các thao tác git:

### 2.1. Kéo code mới nhất từ nhánh `main` (Pull)
Mỗi khi bắt đầu làm việc hoặc muốn cập nhật code mới từ GitHub về máy:
```powershell
.\sync-git.ps1 pull
```

### 2.2. Đẩy code lên nhánh `main` (Push / Deploy)
Khi bạn sửa xong code và muốn commit + push lên GitHub:
```powershell
.\sync-git.ps1 push "Nội dung ghi chú commit ở đây"
```
*Script sẽ tự động: `git add .` -> `git commit -m "..."` -> `git push` với token đã xác thực.*

### 2.3. Cài đặt Remote Origin tự động với Token (Setup một lần)
Nếu muốn sử dụng các lệnh chuẩn như `git pull` và `git push` trực tiếp trong terminal mà không cần thông qua script:
```powershell
.\sync-git.ps1 setup
```
Sau lệnh này, bạn có thể chạy bình thường:
```powershell
git pull
git push
```

### 2.4. Xem trạng thái git
```powershell
.\sync-git.ps1 status
```

---

## 3. Cách Thao Tác Bằng Lệnh Git Thủ Công (Manual)

Nếu bạn không muốn dùng script, dưới đây là các câu lệnh thủ công tương đương:

### Cách A: Cấu hình trực tiếp URL Origin kèm Token
```powershell
# Gán remote origin kèm token (lấy từ .env)
git remote set-url origin https://<GITHUB_TOKEN>@github.com/th982982982-crypto/KKhome.git

# Kéo code mới nhất
git pull origin main

# Đẩy code lên
git add .
git commit -m "Cập nhật tính năng"
git push origin main
```

### Cách B: Nạp động token từ `.env` trong PowerShell
```powershell
# Đọc file .env vào biến môi trường
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
    }
}

# Pull với token động
git pull "https://$($env:GITHUB_TOKEN)@github.com/th982982982-crypto/KKhome.git" main

# Push với token động
git push "https://$($env:GITHUB_TOKEN)@github.com/th982982982-crypto/KKhome.git" main
```

---

## 4. Quy Trình Cập Nhật & Deploy Lên Production

Quy trình chuẩn khi phát triển và deploy dự án:

```
[1. Sửa code / Tính năng]
          ↓
[2. Kiểm tra build thử nghiệm: npm run build]
          ↓
[3. .\sync-git.ps1 push "Mô tả tính năng"]
          ↓
[4. Code được đẩy lên GitHub nhánh main]
          ↓
[5. Vercel tự động nhận diện commit và Trigger Deploy Production]
```

### Các bước chi tiết:

1. **Kiểm tra trạng thái code trước khi đẩy:**
   ```powershell
   git status
   ```

2. **Chạy kiểm tra build tại máy cục bộ (khuyên dùng):**
   ```powershell
   npm run build
   ```
   *Nếu build pass thành công, đảm bảo khi đẩy lên Vercel sẽ không bị lỗi crash deployment.*

3. **Thực hiện Push lên GitHub:**
   ```powershell
   .\sync-git.ps1 push "Cap nhat giao dien va tinh nang moi"
   ```

4. **Kích hoạt Deploy:**
   - Dự án đã được liên kết với Vercel. Khi nhánh `main` nhận được commit mới, **Vercel sẽ tự động build và deploy** phiên bản mới lên domain chính thức.
   - Bạn có thể truy cập dashboard của Vercel để theo dõi tiến trình build và trạng thái deployment.

---

## 5. Xử Lý Khi Token Hết Hạn Hoặc Cần Đổi Token Mới

Nếu token GitHub hết hạn hoặc bạn tạo token mới:

1. Mở file [`.env`](file:///.env) và cập nhật giá trị mới:
   ```env
   GITHUB_TOKEN=ghp_TOKEN_MOI_CUA_BAN
   ```
2. Chạy lệnh:
   ```powershell
   .\sync-git.ps1 setup
   ```
   Script sẽ tự động đồng bộ token mới vào cấu hình Git của bạn!
