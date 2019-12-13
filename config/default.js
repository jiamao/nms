//基础配置
exports.config = {
    wxMiniPrograme: {
        appid: 'wx0ee68cb48a2a96f8',
        secret: '28a1a07b40f589f50ac18faff9d7f136',
        liveMode: 'SD', //SD（标清）, HD（高清）, FHD（超清）, RTC（实时通话） 小程序直播模式
        //最小码率
        min_bitrate: 50,
        max_bitrate: 500,
        //宽高比，可选值有 3:4, 9:16
        aspect: '3:4'
    }
};