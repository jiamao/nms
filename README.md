
## 安装ffmpeg
文档：https://blog.csdn.net/yy3097/article/details/51063950

node-media-server 中文文档：https://github.com/illuspas/Node-Media-Server/blob/master/README_CN.md

安装 ffmpeg  : sudo apt-get install ffmpeg

推流：ffmpeg -re -i ../video/27.mp4 -c copy -f flv rtmp://localhost/live/27