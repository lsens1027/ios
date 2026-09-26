# 声纹工坊 PWA：长期部署与手机安装

## 一、推荐部署方式

当前项目不是纯静态页面，因为“直接下载 Milora MP3”需要 Node 服务端代理。因此不能只把 HTML 文件放到普通静态空间，必须部署整个 Node 项目。

最简单的长期部署方式有两种：

| 方式 | 适合情况 | 结果 |
|---|---|---|
| Render / Railway / Fly.io 等 Node 云平台 | 不想维护 Linux 服务器 | 自动 HTTPS、自动重启，配置最少 |
| 自己的 Ubuntu VPS | 有服务器、域名或希望完全控制 | 可用 Nginx、HTTPS、systemd 长期运行 |

不要使用当前 `4173-i3cun...manus.computer` 预览地址作为长期地址，它属于临时开发环境，可能休眠或停止。

## 二、云平台部署（推荐新手）

1. 解压 `voiceprint-studio-pwa-deploy.zip`。
2. 把解压后的项目上传到 GitHub 私有仓库。
3. 在 Render 或 Railway 创建一个 Node Web Service。
4. 选择这个 GitHub 仓库。
5. 设置：

```text
Build Command: 不填
Start Command: npm start
Node Version: 20
```

6. 部署完成后，平台会分配一个 HTTPS 地址，例如：

```text
https://voiceprint-studio-xxxx.onrender.com
```

7. 用这个 HTTPS 地址在 Mac、iPhone、安卓浏览器打开。

项目会自动读取云平台提供的 `PORT` 环境变量，不要把端口写死成 4173。

## 三、Ubuntu VPS 部署

以下命令在服务器终端执行。假设系统是 Ubuntu 22.04/24.04，域名是 `voice.example.com`。

### 1. 安装 Node 和 Nginx

```bash
sudo apt update
sudo apt install -y nginx unzip curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

### 2. 上传和安装项目

把 `voiceprint-studio-pwa-deploy.zip` 上传到服务器后执行：

```bash
sudo mkdir -p /opt/voiceprint-studio
sudo unzip -o voiceprint-studio-pwa-deploy.zip -d /opt/voiceprint-studio
cd /opt/voiceprint-studio
npm start
```

先确认服务器本机访问正常：

```bash
curl http://127.0.0.1:4173/
```

看到页面 HTML 后按 `Ctrl+C` 停止临时运行。

### 3. 创建 systemd 常驻服务

```bash
sudo nano /etc/systemd/system/voiceprint-studio.service
```

写入下面内容，注意把 `User` 改成你的 Linux 用户名：

```ini
[Unit]
Description=Voiceprint Studio PWA
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/voiceprint-studio
ExecStart=/usr/bin/node /opt/voiceprint-studio/server.mjs
Environment=NODE_ENV=production
Environment=PORT=4173
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now voiceprint-studio
sudo systemctl status voiceprint-studio
```

### 4. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/voiceprint-studio
```

写入：

```nginx
server {
    listen 80;
    server_name voice.example.com;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/voiceprint-studio /etc/nginx/sites-enabled/voiceprint-studio
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 配置 HTTPS

先把域名 DNS 的 A 记录指向服务器 IP，再执行：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d voice.example.com
```

HTTPS 对录音功能是必须的。没有 HTTPS，手机浏览器通常不会允许麦克风录音。

## 四、手机桌面安装

### iPhone / iPad

1. 必须使用 Safari 打开 HTTPS 正式域名。
2. 点击底部“分享”。
3. 选择“添加到主屏幕”。
4. 点击“添加”。
5. 从桌面点击“声纹工坊”。
6. 第一次录音时允许麦克风权限。

如果更新了 PWA 文件，打开应用后先在 Safari 中刷新一次，再重新打开桌面图标。旧缓存没有更新时，可以删除桌面图标后重新添加。

### Android

1. 使用 Chrome 打开 HTTPS 正式域名。
2. 点击右上角菜单 `⋮`。
3. 选择“添加到主屏幕”或“安装应用”。
4. 确认安装。
5. 第一次录音时允许麦克风权限。

如果 Chrome 没显示安装选项，先打开页面一次、刷新一次，并确认网页使用 HTTPS 且 `manifest.json` 和 `sw.js` 可以访问。

### Mac

推荐使用 Chrome 或 Edge：

1. 打开 HTTPS 正式域名。
2. 地址栏右侧点击安装图标，或打开菜单选择“安装声纹工坊”。
3. 安装后可以从应用启动器打开。

Safari Mac 可以直接使用，但 PWA 安装入口可能随 macOS 版本不同；直接保存书签也可以。

## 五、首次配置

打开应用后点击右上角设置按钮，选择 API 服务商，填写 Endpoint、API Key 和模型。Milora 的 Endpoint 是：

```text
https://api.milorapart.top/apis/mbAIsc
```

Milora 通常不需要 API Key。阿里云声音复刻参考音频支持 MP3、M4A、WAV，iPhone Safari 录音生成的 M4A 可以直接使用。

## 六、更新项目

替换服务器项目文件后执行：

```bash
sudo systemctl restart voiceprint-studio
sudo systemctl status voiceprint-studio
```

手机端刷新一次页面即可。若仍是旧界面，关闭 PWA 后重新打开，或删除后重新添加到桌面。

## 七、常用排错命令

```bash
sudo journalctl -u voiceprint-studio -n 100 --no-pager
sudo nginx -t
curl -I https://voice.example.com/
curl -I https://voice.example.com/manifest.json
curl -I https://voice.example.com/sw.js
```

确认以下三项都能返回 `200`：

```text
/
/manifest.json
/sw.js
```
