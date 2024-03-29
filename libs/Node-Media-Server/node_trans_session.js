//
//  Created by Mingliang Chen on 18/3/9.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
const Logger = require('./node_core_logger');

const EventEmitter = require('events');
const { spawn } = require('child_process');
const dateFormat = require('dateformat');
const mkdirp = require('mkdirp');
const fs = require('fs');

class NodeTransSession extends EventEmitter {
  constructor(conf) {
    super();
    this.conf = conf;
  }

  run() {
    let vc = 'copy';
    let ac = this.conf.args.ac == 10 ? 'copy' : this.conf.ac ? this.conf.ac : 'aac';
    let inPath = 'rtmp://127.0.0.1:' + this.conf.port + this.conf.streamPath;
    let ouPath = `${this.conf.mediaroot}/${this.conf.app}/${this.conf.stream}`;
    let mapStr = '';
    let filename = '';
    if (this.conf.mp4) {
      this.conf.mp4Flags = this.conf.mp4Flags ? this.conf.mp4Flags : '';
      //let now = new Date();
     
      if(typeof this.conf.fileName == 'function') {
        filename = this.conf.fileName.call(this);
      }
      else {
        filename = dateFormat('yyyymmddHHMMss') + '.mp4';
      }
      
      let mapMp4 = `${this.conf.mp4Flags}${ouPath}/${filename}|`;
      mapStr += mapMp4;
      Logger.log('[Transmuxing MP4] ' + this.conf.streamPath + ' to ' + ouPath + '/' + filename);
    }
    if (this.conf.hls) {
      this.conf.hlsFlags = this.conf.hlsFlags ? this.conf.hlsFlags : '';
      filename = 'index.m3u8';
      let mapHls = `${this.conf.hlsFlags}${ouPath}/${filename}|`;
      mapStr += mapHls;
      Logger.log('[Transmuxing HLS] ' + this.conf.streamPath + ' to ' + ouPath + '/' + filename);
    }
    if (this.conf.dash) {
      this.conf.dashFlags = this.conf.dashFlags ? this.conf.dashFlags : '';
      filename = 'index.mpd';
      let mapDash = `${this.conf.dashFlags}${ouPath}/${filename}`;
      mapStr += mapDash;
      Logger.log('[Transmuxing DASH] ' + this.conf.streamPath + ' to ' + ouPath + '/' + filename);
    }
    mkdirp.sync(ouPath);
    let argv = ['-y', '-fflags', 'nobuffer', '-analyzeduration', '1000000', '-i', inPath, '-c:v', vc, '-c:a', ac, '-f', 'tee', '-map', '0:a?', '-map', '0:v?', mapStr];
    Logger.ffdebug(argv.toString());
    this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);
    this.ffmpeg_exec.on('error', (e) => {
      Logger.ffdebug(e);
    });

    this.ffmpeg_exec.stdout.on('data', (data) => {
      Logger.ffdebug(`FF输出：${data}`);
    });

    this.ffmpeg_exec.stderr.on('data', (data) => {
      Logger.ffdebug(`FF输出：${data}`);
    });

    this.ffmpeg_exec.on('close', (code) => {
      Logger.log('[Transmuxing end] ' + this.conf.streamPath);
      this.emit('end');
      fs.readdir(ouPath, function (err, files) {
        if (!err) {
          files.forEach((filename) => {
            if (filename.endsWith('.ts')
              || filename.endsWith('.m3u8')
              || filename.endsWith('.mpd')
              || filename.endsWith('.m4s')) {
              fs.unlinkSync(ouPath + '/' + filename);
            }
          })
        }
      });
    });

    //通知回调
    if(this.conf.callback) {
      this.conf.callback.call(this, {
        outPath: ouPath,
        filename: filename
      });
    }
  }

  end() {
    // this.ffmpeg_exec.kill('SIGINT');
    this.ffmpeg_exec.stdin.write('q');
  }
}

module.exports = NodeTransSession;