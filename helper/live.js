const mysqlHelper = require('./mysql').connect();

//更新直播状态
exports.updateState = function(liveid, state, callback) {
    console.log(liveid, state);
    mysqlHelper.query('update tblive set state=?,lastupdateon=? where liveid=?', [state,new Date(), liveid], function(err, result, fields) {
        console.log(err||result);
        if(result && result.affectedRows > 0) {
            callback && callback(err, result);
        }
        else {            
            callback && callback(err, null);
        }
    });
}

//更新直播文件路径
exports.updateFile = function(liveid, filename, filepath, callback) {
    mysqlHelper.query('update tblive set filename=?,path=? where liveid=?', [filename, filepath, liveid], function(err, result, fields) {
        console.log(err||result);
        if(result && result.affectedRows > 0) {
            callback && callback(err, result);
        }
        else {
            callback && callback(err, null);
        }
    });
}