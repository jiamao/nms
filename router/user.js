const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const uuidv1 = require('uuid/v1');

const mysqlHelper = require('../helper/mysql').connect();
const authConfig = require('../config/auth');
const defaultConfig = require('../config/default').config;
const wxHelper = require('../helper/wx');

//获取直播ID，根据配置加密
router.get('/get_live_id/:cmd/:liveid' , function(req, res, next){
    let ret = {
        ret: 0,
        msg: '',
        //直播模式
        liveMode: defaultConfig.wxMiniPrograme.liveMode,
        //最小码率
        min_bitrate: defaultConfig.wxMiniPrograme.min_bitrate||50,
        //最大码率
        max_bitrate: defaultConfig.wxMiniPrograme.max_bitrate||500,
        //宽高比
        aspect: defaultConfig.wxMiniPrograme.aspect||'3:4'
    };
    
    ret.liveid = req.params.liveid; 
    //如果直播号为空，则生成唯一号
    if(ret.liveid == '0' || !ret.liveid) {
        //观看者必须指定id
        if(req.params.cmd == 'play') {
            ret.ret = 108;
            ret.msg = '请指定你想观看的直播ID';
            res.json(ret); 
        }
        else {
            createLiveId({
                userid: req.query.uid
            }, function(err, data){
                if(err) {
                    ret.ret = 105;
                    ret.msg = err.message||'生成直播号失败，请稍候再试';
                }
                else {
                    //生成签名
                    req.params.liveid = ret.liveid = data.liveid;
                    createSign(req.params, ret);
                }
                console.log(ret);
                res.json(ret); 
            });
        }
    }
    else {
        //生成签名
        createSign(req.params, ret);
        res.json(ret); 
    }
});

//生成登录态
//如果没有过这个用户，则新生成一个
router.get('/get_session', function(req, res, next){
    let ret = {
        ret: 0,
        msg: ''
    };

    if(req.query.code) {
        wxHelper.getInfo(req.query.code, function(err, data) {
            if(err) {
                ret.ret = 101;
                ret.msg = err.toString();                
                res.json(ret);
            }
            else {
                console.log('getUserByOpenid:' + data.openid);
                //通过openid去DB中查找这个用户，如果找不到则新增一个
                getUserByOpenid(data.openid, function(err, user) {
                    if(err) {
                        ret.ret = 102;
                        ret.msg = err.message;
                    }
                    else if(user) {
                        ret.data = {
                            id: user.id,
                            session_id: uuidv1().replace(/-/g, ''),
                            wx_name: user.wx_name,
                            nickname: user.nickname,
                            auth: user.auth
                        };
                        setSession(ret.data, data.session_key);
                    }
                    else {
                        user = {
                            wx_id: data.openid,
                            wx_name: req.query.wx_name,
                            wx_header: req.query.wx_header,
                            createon: new Date()
                        };
                        createUser(user, function(err, udata) {
                            if(err) {
                                ret.ret = 103;
                                ret.msg = '注册用户失败:' + err.message;                                
                            }
                            else {
                                console.log(udata);
                                ret.data = {
                                    id: udata.insertId,
                                    session_id: uuidv1().replace(/-/g, ''),
                                    wx_name: user.wx_name,
                                    nickname: user.nickname,
                                    auth: user.auth||''
                                };
                                setSession(ret.data, data.session_key);
                            }
                            console.log(ret);
                            res.json(ret);
                        });
                        return;
                    }
                    console.log(ret);
                    res.json(ret);
                });
            }
        });
    }
    else {
        ret.ret = 100;
        ret.msg = 'code 参数不可为空';
        res.json(ret);
    }
});

//获取当前在线的直播
router.get('/live_list', function(req, res, next) {
    let ret = {
        ret: 0,
        msg: ''
    };
    //查最近上线的100个直播
    mysqlHelper.query('select a.*, date_format(a.lastupdateon, \'%h:%i\') as last_time,b.wx_header,b.wx_name,b.nickname from tblive a left join tbuser b on b.id=a.userid where state=1 order by createon desc limit 100', function(err, result, fields) {
        //console.log(err||result);
        if(!err) {
            ret.data = result;
        }
        else {
            ret.ret = 106;
            ret.msg = err.message || '服务器异常，请稍候再试';
        }
        res.json(ret);
    });
});

//通过session_id获取用户auth等信息
router.get('/get_auth', function(req, res, next) {
    let ret = {
        ret: 0,
        msg: ''
    };
    
    mysqlHelper.query('select a.lastupdateon,b.wx_header,b.wx_name,b.nickname,b.auth from tbsession a left join tbuser b on b.id=a.userid where session_id=?', 
        [req.query.session_id], function(err, result, fields) {
        //console.log(err||result);
        if(!err) {
            ret.data = result[0];
        }
        else {
            ret.ret = 106;
            ret.msg = err.message || '服务器异常，请稍候再试';
        }
        console.log(ret);
        res.json(ret);
    });
});

//生成请求串的唯一加密码
//3.请求过期时间为: 2017/8/23 11:25:21 ,则请求过期时间戳为:
/*>1503458721

4.md5计算结合“完整流地址-失效时间-密钥”的字符串:
>HashValue = md5("/live/stream-1503458721-nodemedia2017privatekey”)  
>HashValue = 80c1d1ad2e0c2ab63eebb50eed64201a

5.最终请求地址为
> rtmp://127.0.0.1/live/stream?sign=1503458721-80c1d1ad2e0c2ab63eebb50eed64201a  
> 注意：'sign' 关键字不能修改为其他的*/
function createSign(params, ret) {
    if(authConfig.liveAuth && 
        ((params.cmd == 'publish' && authConfig.liveAuth.publish) || 
        (params.cmd == 'play' && authConfig.liveAuth.play))
    ) {
        let now = new Date();
        now.setSeconds(now.getSeconds() + 60)
        ret.timestamp = Math.floor(now.getTime()/1000); //10秒有效
        let hv = `/live/${ret.liveid}-${ret.timestamp}-${authConfig.liveAuth.secret}`;
        ret.hashValue = crypto.createHash('md5').update(hv).digest('hex'); 
        //ret.sign = `${ret.timestamp}-${ret.hashValue}`;
    }
}

//生成唯一房间号，并计录到DB中
function createLiveId(info, callback) {
    info.liveid = uuidv1().replace(/-/g,'');//生成唯一ID
    info.createon = new Date();

    mysqlHelper.query('insert into tblive set ?', info, function(err, result, fields) {

        if(result.affectedRows > 0) {
            callback && callback(err, info);
        }
        else {
            callback && callback(err, null);
        }
    });
}

//通过微信ID获取关联的用户信息
function getUserByOpenid(openid, callback) {
    mysqlHelper.query('select * from tbuser where wx_id=?', [openid], function(err, result, feilds) {
        console.log(err||result);
        if(err) {
            callback && callback(err, null);
        }
        else {
            if(result.length) callback && callback(null, result[0]);
            else callback && callback(null, null);
        }
    });
}

//插一个用户到DB中
function createUser(info, callback) {
    info.auth = '11';//现写死所有人都有权限
    mysqlHelper.query('insert into tbuser set ?', info, function(err, result, feilds) {        
        callback && callback(err, result);
    });
}

//更新session表，没有就插入一条
function setSession(user, session_key, callback) {
    mysqlHelper.query('replace into tbsession set ?', {
        session_id: user.session_id,
        userid: user.id,
        wx_session_key: session_key,
        lastupdateon: new Date(),
        createon: new Date()
    }, function(err, result, feilds) {    
        console.log(result);    
        callback && callback(err, result);
    });
}

module.exports = router;