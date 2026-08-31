# 考公工作台

公务员考试备考学习管理台，支持首页总览、行测与综合模块练习、番茄钟、错题本、
打卡日历和学习统计。数据保存在浏览器 `localStorage`。

## 直接使用

- 电脑或手机浏览器打开 `index.html`。
- 单文件版本 `index_inline.html` 可直接发送到手机，用浏览器打开。
- 手机和电脑同一 WiFi 时，运行 `python -m http.server 8080` 后手机访问电脑 IP。

## 构建 Android APK

本仓库已配置 GitHub Actions。推送到 GitHub 后，在 Actions 页面手动运行
`Build APK` 工作流，构建完成后下载 `kaogong-workbench-apk` 产物即可。
