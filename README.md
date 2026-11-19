# Góc Game Học Tập

Bộ game nhỏ phục vụ học tập cho trẻ, viết bằng HTML + JavaScript thuần (không cần cài đặt gì).

## Cách chơi

Mở file `index.html` bằng trình duyệt (nhấp đúp là được).

## Danh sách game

| Game | Mô tả |
|------|-------|
| [Nhảy Qua Quái Vật](games/key-jump/index.html) | Luyện gõ phím: mỗi con quái vật mang một chữ cái, gõ đúng phím để nhân vật nhảy qua. 15 màn từ F/J đến hàng số. |

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
