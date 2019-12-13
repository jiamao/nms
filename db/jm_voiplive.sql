/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 80011
Source Host           : 127.0.0.1:3306
Source Database       : jm_voiplive

Target Server Type    : MYSQL
Target Server Version : 80011
File Encoding         : 65001

Date: 2018-06-24 22:45:53
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `tblive`
-- ----------------------------
DROP TABLE IF EXISTS `tblive`;
CREATE TABLE `tblive` (
  `liveid` varchar(64) NOT NULL,
  `state` int(11) DEFAULT 0,
  `userid` int(11) DEFAULT NULL,
  `filename` varchar(32) DEFAULT NULL,
  `path` varchar(128) DEFAULT NULL,
  `lastupdateon` datetime DEFAULT NULL,
  `createon` datetime DEFAULT NULL,
  PRIMARY KEY (`liveid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of tblive
-- ----------------------------

-- ----------------------------
-- Table structure for `tbuser`
-- ----------------------------
DROP TABLE IF EXISTS `tbuser`;
CREATE TABLE `tbuser` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wx_id` varchar(64) DEFAULT NULL,
  `wx_name` varchar(32) DEFAULT NULL,
  `wx_header` varchar(256) DEFAULT NULL,
  `nickname` varchar(16) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `auth` varchar(8) DEFAULT NULL,
  `createon` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wx` (`wx_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of tbuser
-- ----------------------------

-- ----------------------------
-- Table structure for `tbsession`
-- ----------------------------
DROP TABLE IF EXISTS `tbsession`;
CREATE TABLE `tbsession` (
  `session_id` varchar(64) NOT NULL,
  `wx_session_key` varchar(64) DEFAULT NULL,
  `userid` int(11) NOT NULL,
  `lastupdateon` datetime DEFAULT NULL,
  `createon` datetime DEFAULT NULL,
  PRIMARY KEY (`userid`),
  KEY `session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of tbsession
-- ----------------------------
