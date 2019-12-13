


const NodeMediaServer  = require('./libs/Node-Media-Server/node_media_cluster');
const numCPUs = require('os').cpus().length;

const userRouter = require('./router/user');
const authConfig = require('./config/auth');

const liveHelper = require('./helper/live');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 60,
    ping_timeout: 30
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*',
    //初始化外挂http
    init: function(app){
      //获取直播ID接口，并且根据配置加密
      app.use('/user', userRouter);
    }
  },
  auth: authConfig.liveAuth,
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        ac: 'aac',
        mp4: true,
        mp4Flags: '[movflags=faststart]',
        //生成文件回调
        callback: function(opt) {
          console.log(opt);
          if(this.conf.stream) {
            liveHelper.updateFile(this.conf.stream, opt.filename, opt.outPath);//更新直播文件路径
          }
          //更新直播状态
          //if(liveid) {
          //  if(liveid.indexOf('-') > -1) liveid = liveid.split('-')[0];
          //  liveHelper.updateState(liveid, 2);//更新状态为已结束
          //}
        }
      }
      /*,
      {
        app: 'live',
        ac: 'aac',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        //dash: true,
        dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
      }*/
    ]
  },
  cluster: {
    num: numCPUs
  }
};

var nmcs = new NodeMediaServer (config)
nmcs.run();

nmcs.on('prePublish', (id, StreamPath, args, liveid) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)} liveid=${liveid}`);
  //更新直播状态
  if(liveid) {
    if(liveid.indexOf('-') > -1) liveid = liveid.split('-')[0];
    liveHelper.updateState(liveid, 1);//更新状态为正在直播
  }
   //let session = nmcs.getSession(id);
   //console.log(session);
  // session.reject();liveHelper
});


nmcs.on('postPublish', (id, StreamPath, args, liveid) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)} liveid=${liveid}`);
  
});

nmcs.on('donePublish', (id, StreamPath, args, liveid) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)} liveid=${liveid}`);
  //更新直播状态
  if(liveid) {
    if(liveid.indexOf('-') > -1) liveid = liveid.split('-')[0];
    liveHelper.updateState(liveid, 2);//更新状态为已结束
  }
});

nmcs.on('doneConnect', (id, StreamPath, args) => {
  console.log('[NodeEvent on doneConnect]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});
