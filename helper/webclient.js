const http = require('http');  
const https = require('https');
const qs = require('querystring');  


exports.httpGet = function(options) {
    var req = http.request(options, function (res) {  
        console.log('STATUS: ' + res.statusCode);  
        console.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');  
        res.on('data', function (chunk) {  
            console.log('BODY: ' + chunk);  
        });  
    });  
      
    req.on('error', function (e) {  
        console.log('problem with request: ' + e.message);  
    });  
      
    req.end();  
}

//httpsGET请求
exports.httpsGet = function(url, callback) {
    https.get(url, (res) => {
        //console.log('状态码：', res.statusCode);
        //console.log('请求头：', res.headers);
        var data = '';
        res.on('data', (d) => {
            data += d;
        }).on('end', function(){
            callback && callback(null, data);
        });

    }).on('error', (e) => {
        console.error(e);
        callback && callback(e, null);
    });
}

exports.httpsPost = function(options) {
    options = options||{
        hostname: 'encrypted.google.com',
        port: 443,
        path: '/',
        method: 'GET'
      };
      
      const req = https.request(options, (res) => {
        console.log('状态码：', res.statusCode);
        console.log('请求头：', res.headers);
      
        res.on('data', (d) => {
          process.stdout.write(d);
        });
      });
      
      req.on('error', (e) => {
        console.error(e);
      });
      req.end();
}