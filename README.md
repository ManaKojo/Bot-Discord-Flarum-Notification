# 🤖 Flarum Discord Notification Bot

Bot Discord tự động theo dõi, duyệt và thông báo bài viết mới từ Flarum Forum.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?logo=discord)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Tính năng chính

| Tính năng | Mô tả |
|---|---|
| 🔄 **Polling tự động** | Kiểm tra bài viết mới mỗi 30 giây |
| 🏷️ **Multi-tag** | Hỗ trợ nhiều tag với kênh review/thông báo riêng |
| ✅ **Hệ thống duyệt** | Admin duyệt/từ chối bằng nút bấm Discord |
| ⚡ **Auto approve** | Tự động duyệt theo tác giả, tag, whitelist |
| 🔔 **Mention role** | Mention role tùy theo tag |
| 🛡️ **Chống trùng** | Database SQLite + cache in-memory |
| 📊 **Dashboard** | Theo dõi trạng thái qua `/status` |
| ⚙️ **Setup trên Discord** | Cấu hình hoàn toàn bằng slash command |

---

## 📁 Cấu trúc dự án

```text
flarum-discord-bot/
├── index.js                          # Entry point
├── package.json
├── .env.example
├── data/                             # SQLite database (tự tạo)
│   └── bot.db
└── src/
    ├── api/
    │   └── flarum.js                 # Flarum REST API client
    ├── buttons/
    │   └── reviewButtons.js          # Nút Duyệt/Từ chối/Xem bài viết
    ├── commands/
    │   ├── setup-tag.js              # /setup-tag
    │   ├── remove-tag.js             # /remove-tag
    │   ├── list-tags.js              # /list-tags
    │   ├── edit-tag.js               # /edit-tag
    │   ├── reload.js                 # /reload
    │   ├── status.js                 # /status
    │   ├── forcecheck.js             # /forcecheck
    │   └── ping.js                   # /ping
    ├── config/
    │   └── index.js                  # Nạp cấu hình từ .env
    ├── database/
    │   └── dbService.js              # SQLite (better-sqlite3) CRUD
    ├── embeds/
    │   ├── reviewEmbed.js            # Embed duyệt bài
    │   └── announceEmbed.js          # Embed thông báo
    ├── events/
    │   ├── ready.js                  # Bot khởi động
    │   └── interactionCreate.js      # Xử lý commands + buttons
    ├── handlers/
    │   └── commandHandler.js         # Đăng ký slash commands
    ├── logger/
    │   └── index.js                  # Logger có màu
    ├── services/
    │   ├── pollService.js            # Polling Flarum định kỳ
    │   └── queueService.js           # Hàng đợi xử lý
    └── utils/
        ├── cache.js                  # In-memory cache TTL
        └── helpers.js                # Tiện ích chung
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Node.js** >= 18
- **npm** >= 9
- **PM2** (cho production)

### Bước 1: Clone / Download dự án

```bash
git clone <repository-url>
cd flarum-discord-bot
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Tạo file .env

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` theo hướng dẫn bên dưới.

### Bước 4: Chạy bot

```bash
# Development
node index.js

# Production với PM2
pm2 start index.js --name flarum-bot
pm2 save
```

---

## 🤖 Hướng dẫn tạo Discord Bot

### Bước 1: Tạo Application

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → đặt tên → **Create**
3. Vào tab **Bot** → click **Add Bot**

### Bước 2: Lấy Token

1. Trong tab **Bot** → click **Reset Token** → **Copy**
2. Dán vào `DISCORD_TOKEN` trong file `.env`

### Bước 3: Bật Intents

Trong tab **Bot**, bật 3 intents:

- ✅ **Presence Intent**
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

### Bước 4: Lấy Client ID

1. Vào tab **General Information**
2. Copy **Application ID** → dán vào `CLIENT_ID` trong `.env`

### Bước 5: Invite bot vào server

Vào tab **OAuth2** → **URL Generator**:

- Scopes: `bot`, `applications.commands`
- Permissions: `Administrator` (hoặc tùy chỉnh)

Copy URL và mở trên trình duyệt để invite bot.

### Bước 6: Lấy Guild ID

1. Mở Discord → **Cài đặt người dùng** → **Nâng cao** → Bật **Developer Mode**
2. Click phải vào tên server → **Copy Server ID**
3. Dán vào `GUILD_ID` trong `.env`

---

## 📝 Cấu hình file .env

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `DISCORD_TOKEN` | Token bot Discord | `MTIz...` |
| `CLIENT_ID` | Application ID | `123456789` |
| `GUILD_ID` | Server ID | `987654321` |
| `FLARUM_API` | URL API Flarum | `https://forum.example.com/api` |
| `FLARUM_BASE` | URL gốc Flarum | `https://forum.example.com` |
| `FLARUM_API_TOKEN` | Token API (nếu cần) | `abc123` |
| `POLL_INTERVAL` | Chu kỳ polling (ms) | `30000` |
| `CONTENT_PREVIEW_LENGTH` | Độ dài preview | `300` |
| `AUTO_APPROVE_AUTHORS` | Whitelist tác giả | `admin,moderator` |
| `AUTO_APPROVE_TAGS` | Whitelist tag | `announcement` |
| `ADMIN_ROLE_IDS` | Role ID admin | `111,222` |
| `FORUM_NAME` | Tên forum | `My Forum` |

---

## ⚙️ Slash Commands

| Command | Mô tả | Quyền |
|---|---|---|
| `/setup-tag` | Thiết lập tag mới | Admin |
| `/remove-tag` | Xóa cấu hình tag | Admin |
| `/list-tags` | Xem danh sách tag | Admin |
| `/edit-tag` | Chỉnh sửa tag | Admin |
| `/reload` | Reload config | Admin |
| `/status` | Xem trạng thái bot | Admin |
| `/forcecheck` | Ép check bài mới | Admin |
| `/ping` | Kiểm tra độ trễ | Mọi người |

### Ví dụ setup multi-tag

```
/setup-tag tag_slug:news tag_name:Tin tức review_channel:#duyệt-tin announce_channel:#thông-báo mention_role:@News auto_approve:false

/setup-tag tag_slug:event tag_name:Sự kiện review_channel:#duyệt-event announce_channel:#sự-kiện mention_role:@Event auto_approve:false
```

---

## 🖼️ Ví dụ Embed

### Embed duyệt bài (kênh review)

```
┌───────────────────────────────────────┐
│ 📋 Yêu cầu duyệt bài viết           │
│                                       │
│ 📝 Tiêu đề: Cập nhật phiên bản 2.0   │
│ 🏷️ Tag: Tin tức                       │
│ 👤 Tác giả: Admin                     │
│ 🕒 Thời gian: 5 phút trước           │
│ 🔢 ID: #42                            │
│ 💬 Bình luận: 3                       │
│                                       │
│ 📄 Xem trước:                         │
│ Chúng tôi vui mừng thông báo...       │
│                                       │
│ [✅ Duyệt] [❌ Từ chối] [🔗 Xem]     │
└───────────────────────────────────────┘
```

### Embed thông báo (kênh announcement)

```
@News
📢 Có bài viết mới!

┌───────────────────────────────────────┐
│ 📝 Cập nhật phiên bản 2.0            │
│                                       │
│ 📢 Bài viết mới trong [Tin tức]      │
│ 👤 Tác giả: Admin                     │
│ 🕒 Thời gian: 5 phút trước           │
│ 🏷️ Tag: Tin tức                       │
│                                       │
│ 📄 Nội dung xem trước:               │
│ Chúng tôi vui mừng thông báo...       │
│                                       │
│ [🔗 Xem bài viết]                     │
└───────────────────────────────────────┘
```

---

## 🖥️ Cách lấy Channel ID / Role ID Discord

1. Mở **Discord** → **Cài đặt người dùng** (bánh răng)
2. **Nâng cao** → Bật **Chế độ nhà phát triển (Developer Mode)**
3. Click phải vào **kênh** → **Sao chép ID kênh**
4. Click phải vào **role** → **Sao chép ID vai trò**

---

## ☁️ Deploy lên Oracle Cloud VPS (Free Tier)

### Bước 1: Tạo VPS Oracle Cloud

1. Đăng ký tại [cloud.oracle.com](https://cloud.oracle.com) (miễn phí)
2. Vào **Compute** → **Instances** → **Create Instance**
3. Chọn **Ubuntu 22.04** → Shape **VM.Standard.E2.1.Micro** (Free)
4. Tải về file SSH Key (.key)
5. Click **Create**

### Bước 2: Mở port SSH

1. Vào **Networking** → **Virtual Cloud Networks** → chọn VCN
2. **Subnet** → **Security Lists** → **Default Security List**
3. Thêm Ingress Rule: Source `0.0.0.0/0`, Port `22`, Protocol TCP

### Bước 3: Kết nối SSH

```bash
ssh -i <path-to-key> ubuntu@<public-ip>
```

### Bước 4: Cài đặt môi trường

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node -v
npm -v

# Cài PM2
sudo npm install -g pm2
```

### Bước 5: Upload và chạy bot

```bash
# Clone/upload dự án
cd /home/ubuntu
git clone <repo-url> flarum-discord-bot
cd flarum-discord-bot

# Cài dependencies
npm install

# Tạo file .env
cp .env.example .env
nano .env   # Điền token và cấu hình

# Chạy với PM2
pm2 start index.js --name flarum-bot
pm2 save
pm2 startup  # Tự khởi động khi VPS reboot
```

---

## 🔑 Kết nối bằng Bitvise SSH Client (Windows)

### Bước 1: Tải Bitvise

Tải tại [bitvise.com](https://www.bitvise.com/ssh-client-download)

### Bước 2: Cấu hình kết nối

1. Mở Bitvise SSH Client
2. **Host:** Nhập Public IP của VPS
3. **Port:** `22`
4. **Username:** `ubuntu`
5. **Initial Method:** `publickey`
6. **Client Key:** Import file `.key` từ Oracle

### Bước 3: Kết nối

1. Click **Log in**
2. Mở **New Terminal Console** để nhập lệnh
3. Mở **New SFTP Window** để upload/download file

### Bước 4: Upload dự án qua SFTP

1. Bên trái: chọn thư mục dự án trên máy local
2. Bên phải: điều hướng đến `/home/ubuntu/`
3. Kéo thả thư mục dự án sang bên phải
4. Mở Terminal, chạy `cd /home/ubuntu/flarum-discord-bot && npm install`

---

## 🐧 Các lệnh Linux thường dùng

```bash
# Quản lý PM2
pm2 start index.js --name flarum-bot   # Khởi chạy
pm2 restart flarum-bot                  # Khởi động lại
pm2 stop flarum-bot                     # Dừng
pm2 delete flarum-bot                   # Xóa
pm2 logs flarum-bot                     # Xem logs
pm2 monit                              # Giám sát realtime
pm2 save                               # Lưu danh sách process
pm2 startup                            # Auto start khi reboot

# Hệ thống
sudo apt update && sudo apt upgrade -y  # Cập nhật
htop                                    # Giám sát tài nguyên
df -h                                   # Dung lượng ổ đĩa
free -h                                 # RAM
```

---

## 🚂 Deploy trên Railway

1. Đăng ký tại [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Chọn repository
4. Vào **Variables** → thêm tất cả biến từ `.env`
5. Railway sẽ tự động build và deploy

---

## 🔧 Troubleshooting

### Bot không gửi tin nhắn

- Kiểm tra bot có quyền `Send Messages`, `Embed Links` trong kênh
- Kiểm tra Channel ID có đúng không
- Chạy `/status` để kiểm tra API Flarum

### Discord Missing Permissions

- Bot cần quyền `Administrator` hoặc các quyền cụ thể
- Kiểm tra role của bot trong server settings

### Flarum API timeout

- Kiểm tra URL `FLARUM_API` trong `.env`
- Tăng `API_TIMEOUT` lên 15000 hoặc 20000
- Kiểm tra Flarum có chặn IP không

### Duplicate interaction

- Hệ thống đã có cơ chế chống trùng tự động
- Kiểm tra database `data/bot.db`

### PM2 crash liên tục

```bash
pm2 logs flarum-bot --lines 50   # Xem 50 dòng log cuối
pm2 restart flarum-bot           # Restart thủ công
```

### Bot không nhận slash command

```bash
# Xóa và đăng ký lại commands
node -e "
const { REST, Routes } = require('discord.js');
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] })
  .then(() => console.log('Đã xóa commands'))
  .catch(console.error);
"
# Sau đó restart bot
pm2 restart flarum-bot
```

---

## 📄 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.
