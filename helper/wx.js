
const config = require('../config/default').config;
const webclient = require('./webclient');

//通过code获取用户openid
//https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
exports.getInfo = function(code, callback) {
    let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wxMiniPrograme.appid}&secret=${config.wxMiniPrograme.secret}&js_code=${code}&grant_type=authorization_code`;
    //openid
    //session_key
    webclient.httpsGet(url, function(err, data) {
        if(err) {
            callback && callback(err, null);
        }
        else {
            if(typeof data == 'string') data = JSON.parse(data);
            if(data.errcode) {
                callback && callback(data.errmsg||'获取微信用户信息失败', data);
                return;
            }
            callback && callback(null, data);
        }
    });
}