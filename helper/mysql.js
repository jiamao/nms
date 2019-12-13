/*****************************************************************************
Copyright: Tencent
Description: mysql数据库访问模块
Author: fefeding
Version: 1.0
Date: 2012/12/19
*****************************************************************************/

const mysql=require("mysql");
const dbConfig = require('../config/db').config;

/**
* mysql 辅助类
* param config 为连接信息，比如：{host:"localhost",user:'root',password:'123456',database:"test"}
*/
var client = function(config) {	
	config = config || dbConfig.default;
	/**
	* 处理连接异常
	*/
	function handleDisconnect(connection,callback) {
	    connection.on('error', function(err) {
		    if (!err.fatal) {
		      return;
		    }

		    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
		      callback(err);
		    }

		    console.log('Re-connecting lost connection: ' + err.stack);

		    connection = mysql.createConnection(config);
		    handleDisconnect(connection);
		    connection.connect(function(error) {
		    	callback(error,connection);
		    });
	  	});
	  	//callback(null,connection);
	  	//return;
	  	connection.connect(function(error) {
	    	callback(error,connection);
	  	});
	}
	this.createConnection = function(callback) {
		//console.log(config);
		var connection = mysql.createConnection(config);
		handleDisconnect(connection,callback);
		return;
		if(!this.pool) this.pool = mysql.createPool(config);
		
		this.pool.getConnection(function(err,connection) {			
			if(err) {
				callback(err);
			}
			else {
				if(!connection) {
					connection = mysql.createConnection(config);					
				}	
				handleDisconnect(connection,callback);				
			}
		});
	}	
	
	/**
	* 执行sql
	* 通过回调返回结果，例如：callback(err,result,fields)
	*/
	//this.init();
	this.query = function(sql,pars,callback) {
		if(typeof pars === 'function') {
			callback = pars;
			pars = null;
		}
		//this.mysqlClient.query.apply(this.mysqlClient,arguments);
		
		this.createConnection(function(e,connection) {
			if(e) {
				if(callback) callback(e);
				return;
			}
			if(pars) {
		  		connection.query(sql,pars,function(error,data,fields) {		  			
		  			connection.end(function(error) {
		  				if(error) console.log(error);
					  });
					if(error) {
						console.error(error);
						error = {
							message: error.sqlMessage||error.Error
						};
					}
		  			if(callback) callback(error,data,fields);
		  		});
		  	}
		  	else {
		  		connection.query(sql,pars,function(error,data,fields) {		  			
		  			connection.end(function(error) {
		  				if(error) console.log(error);
					  });
					  if(error) {
						console.error(error);
						  error = {
							  message: error.sqlMessage||error.Error
						  };
					  }
		  			if(callback) callback(error,data,fields);
		  		});
		  	}
		});		
	};
}


/**
* 分页查询
*/
client.prototype.search= function(tbName,fields,where,pars,page,count,order,callback) {	
	this.createConnection(function(e,connection) {
		if(e) {
			if(callback) callback(e);
			return;
		}		
	  	if(count) {
			//先获取符合条件的总行数
			var sql= 'select count(0) as count from '+tbName+' where ' + where;			
			connection.query(sql,pars,function(err,countdata) {
				if(err) {
					connection.end(function(error) {
						if(error) console.log(error);
					});
					callback(err);						
				}
				else
				{
					var totalcount= countdata[0]['count'];
					sql= 'select '+fields+' from '+tbName+' where ' + where + ' ' + order;
					
					if(typeof page != 'undifined'){
						var newpage = page -1;
						if(newpage < 0) newpage = 0;
						sql += " limit "+(newpage * count)+"," + count;
					}
					else{
						sql += " limit 0," + count;
					}
					var pagecount = Math.ceil(totalcount / count);				
					connection.query(sql,pars,function(err,data) {
						connection.end(function(error) {							
							if(error) console.log(error);
						});
						callback(err,{data:data,count:totalcount,page:page,pageCount:pagecount});
					});
				}
			});
		}
		else {
			var sql= 'select '+fields+' from '+tbName+' where ' + where + ' ' + order;
			connection.query(sql,pars,function(err,data) {		
				connection.end(function(error) {
						if(error) console.log(error);
					});			
				callback(err,{data:data,count:0});
			});
		}
	});		
}


//var instance = new client(common.config.dbConfig);
exports.client = client;


exports.connect = function(option) {
	return new client(option);
}
