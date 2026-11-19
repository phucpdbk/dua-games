# Góc Game Học Tập

Bộ game nhỏ phục vụ học tập cho trẻ, viết bằng HTML + JavaScript thuần (không cần cài đặt gì).

## Cách chơi

Mở file `index.html` bằng trình duyệt (nhấp đúp là được).

## Danh sách game

| Game | Mô tả |
|------|-------|
| [Nhảy Qua Quái Vật](games/key-jump/index.html) | Luyện gõ phím: mỗi con quái vật mang một chữ cái, gõ đúng phím để nhân vật nhảy qua. 15 màn từ F/J đến hàng số. |
| [Chạy Đua Toán Học](games/math-run/index.html) | Cộng trừ: mỗi chướng ngại vật kèm một phép tính, **nói** đáp án (tiếng Việt, Web Speech API, cần Chrome/Edge) hoặc gõ số để nhảy qua; 3 tim. 11 màn từ cộng trong 10 đến cộng trừ có nhớ trong 100. |

Kiểm thử: `node --test tests/` (đọc số tiếng Việt, sinh phép tính).

## Lưu tiến trình

Tiến trình luôn được lưu trong máy (localStorage) và đồng bộ lên Firestore (dự án Firebase `dua-games-8297e`)
qua REST, cấu hình ở `assets/profile.js`. Khi gộp, game lấy màn mở xa nhất và số sao cao nhất, nên đổi máy không mất gì.

Firestore rules chỉ cho đọc/ghi document `players/dua` với các trường đã khai báo. Khi thêm game mới có lưu tiến trình,
thêm tên trường của game đó vào `hasOnly([...])` trong rules trên Firebase console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/dua {
      allow read: if true;
      allow write: if request.resource.data.keys().hasOnly(['keyjump', 'mathrun'])
                   && request.resource.data.get('keyjump', '') is string
                   && request.resource.data.get('keyjump', '').size() < 2000
                   && request.resource.data.get('mathrun', '') is string
                   && request.resource.data.get('mathrun', '').size() < 2000;
    }
  }
}
```

## Hình ảnh

Hình nhân vật, quái vật, nền được tạo bằng Google Nano Banana Pro (Gemini) qua `tools/gen_art.mjs`
(cách làm giống dự án cay-thong-noel). Cần biến môi trường `GEMINI_API_KEY`.

```bash
npm install
node tools/gen_art.mjs                 # tạo ảnh còn thiếu (mô tả trong tools/art_prompts.mjs)
node tools/gen_art.mjs hero --redo     # tạo lại một ảnh
node tools/gen_art.mjs --reprocess     # chỉ cắt nền/thu nhỏ lại từ tools/raw, không gọi API
```

Ảnh gốc lưu ở `tools/raw/` (không đưa lên git), ảnh dùng trong game là `.webp` trong thư mục `img/` của từng game.

## Thêm game mới

Tạo thư mục mới trong `games/<ten-game>/` với `index.html` riêng, rồi thêm một thẻ vào `index.html` ở thư mục gốc.
