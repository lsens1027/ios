# 声纹工坊 PWA

## 参考音频格式

阿里云声音复刻支持 **MP3、M4A、WAV**，不需要手动转换。PWA 会保留你上传或录制的原始格式，并直接按照当前阿里云模型上传。iPhone Safari 录音通常会生成 M4A/MP4 音频，可直接使用；上传 MP3 也可以直接使用。

如果浏览器生成的是 WebM 或 OGG，阿里云声音复刻不接受时，页面会在生成前明确提示“请使用 MP3、M4A 或 WAV”，不会让你等到服务端返回含糊的失败。

正确的 Milora 接口地址是 `https://api.milorapart.top/apis/mbAIsc`，文档地址不能作为 Endpoint。PWA 已加入同源下载代理，点击下载会直接得到 MP3 文件，不再跳转到 Milora 网站。
