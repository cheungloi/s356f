var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://loicheung:19940319@ds127998.mlab.com:27998/s356f';
var app = express();
var watson = require('watson-developer-cloud');
var visual_recognition = watson.visual_recognition({
  api_key: '48aec928ba8beef4f317e367995107b269704976',
  version: 'v3',
  version_date: '2016-05-20'
});

var SECRETKEY1 = 'loi';
var SECRETKEY2 = 'cheung';
app.set('view engine','ejs');
app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());
app.use('/style', express.static('style'));

app.post('/api', function(req,res){
	console.log(req.body);
});

app.get('/api/checksession', function(req,res){
	if(!req.session.authenticated){
		res.status(200).end(req.session.username);
	}else{
		res.status(400).end("no session");
	}
});

app.post('/api/login', function(req,res){
	var reresult = {};
	console.log("login: "+JSON.stringify(req.body));
	if(!req.body.userid || !req.body.pw){
		reresult['status'] = 'userid or pw empty';
		res.status(500);
		res.send(reresult);
		res.end();
		return;
	}
	var criteria = {"userid":req.body.userid};
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to user');
      assert.equal(null,err);
      login(db, criteria, req.body.pw, function(result){
      	db.close();
      	console.log("login result: "+JSON.stringify(result));
      if (result) {
            res.status(200);
            req.session.authenticated = true;
			req.session.username = result._id;
			console.log("userid: "+req.session.username);
			res.send(result);
			res.end();
        } else {
          	res.status(200);
            reresult['status'] = 'login fail';
			res.send(reresult);
			res.end();
        }
      });
    });
});

app.post('/api/createac', function(req,res){
	var reresult = {};
	console.log("createac: "+JSON.stringify(req.body));
	if(req.body.userid == null || req.body.pw == null){
		reresult['status'] = 'userid or pw empty';
		res.status(401);
		res.send(reresult);
		res.end();
		return;
	}
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to user');
      assert.equal(null,err);
      createac(db, req.body.userid, req.body.pw, req.body.email, req.body, function(result){
      	db.close();
      	console.log("createac result: "+JSON.stringify(result));
      if (result) {
            res.status(200);
            reresult['status'] = 'createac success';
			res.send(reresult);
			res.end();
        } else {
          	res.status(402);
            reresult['status'] = 'userid or email is used';
			res.send(reresult);
			res.end();
        }
      });
    });
});
app.post('/api/updateac',function(req,res){
	var reresult = {};
	console.log("updateac: "+JSON.stringify(req.body));
	if(req.body._id == null){
		res.status(404);
		res.end("no product id");
		return;
	}
	var criteria1 = {"_id":ObjectId(req.body._id)};
	var criteria2 = {};
	criteria2['pw'] = req.body.pw;
	criteria2['phone'] = req.body.phone;
	criteria2['balance'] = req.body.balance;
	criteria2['scode'] = req.body.scode;
	if(req.body.irondata){
		criteria2['irondata'] = req.body.irondata;
		criteria2['irontype'] = req.body.irontype;

	}
	var criteria3 = {$set:criteria2};
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to user');
      assert.equal(null,err);
      updateac(db, criteria1, criteria3, function(result){
      	console.log("updateac result: "+JSON.stringify(result));
    		db.close();
    		if(result==true){
    		res.status(200);
    		reresult['status'] = "update success";
    		res.send(reresult);
    		res.end();
    	}else{
    		res.status(400);
    		reresult['status'] = "update fail";
    		res.send(reresult);
    		res.end();
    	}
    	});
	});
});

app.post('/api/addproduct', function(req,res){
	var reresult = {};
	console.log("addproduct: "+JSON.stringify(req.body));
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to product');
      assert.equal(null,err);
      addproduct(db, req.body, function(result){
      	db.close();
      	console.log("addproduct result: "+JSON.stringify(result));
      if (result==true) {
            res.status(200);
            reresult['status'] = 'add success';
			res.send(reresult);
			res.end();
        } else {
          	res.status(400);
            reresult['status'] = 'add fail';
			res.send(reresult);
			res.end();
        }
      });
    });
});
app.post('/api/addoffer', function(req,res){
	var reresult = {};
	console.log("addoffer: "+JSON.stringify(req.body));
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to offer');
      assert.equal(null,err);
      addoffer(db, req.body, function(result){
      	db.close();
      	console.log("addoffer result: "+JSON.stringify(result));
      if (result==true) {
            res.status(200);
            reresult['status'] = 'add success';
			res.send(reresult);
			res.end();
        } else {
          	res.status(400);
            reresult['status'] = 'add fail';
			res.send(reresult);
			res.end();
        }
      });
    });
});

app.post('/api/updateproduct', function(req,res){
	var reresult = {};
	console.log("updateproduct: "+JSON.stringify(req.body));
	var criteria1 = {"_id":ObjectId(req.body._id)};
	var criteria2 = {};
	criteria2['pname'] = req.body.pname;
	criteria2['ptype'] = req.body.ptype;
	criteria2['brand'] = req.body.brand;
	criteria2['size'] = req.body.size;
	criteria2['price'] = req.body.price;
	criteria2['description'] = req.body.description;
	if(req.body.photo1data){
		criteria2['photo1data'] = req.body.photo1data;
		criteria2['photo1type'] = req.body.photo1type;
	}
	if(req.body.photo2data){
		criteria2['photo2data'] = req.body.photo2data;
		criteria2['photo2type'] = req.body.photo2type;

	}
	if(req.body.photo3data){
		criteria2['photo3data'] = req.body.photo3data;
		criteria2['photo3type'] = req.body.photo3type;

	}
	criteria2['owner'] = req.body.owner;
	criteria2['state'] = req.body.state;
	var criteria3 = {$set:criteria2};
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to product');
      assert.equal(null,err);
      updateproduct(db, criteria1, criteria3, function(result){
    		db.close();
    		console.log("updateproduct result: "+JSON.stringify(result));
    		if(result==true){
    			res.status(200);
    			reresult['status'] = "update product success";
    			res.send(reresult);
    			res.end();
    		}else{
    			res.status(400);
    			reresult['status'] = "update product fail";
    			res.send(reresult);
    			res.end();
    		}
    	});
	});
});

app.post('/api/updateoffer', function(req,res){
	var reresult = {};
	console.log("updateoffer: "+JSON.stringify(req.body));
	var criteria1 = {"_id":ObjectId(req.body._id)};
	var criteria2 = {};
	criteria2['DateTime'] = req.body.DateTime;
	criteria2['place'] = req.body.place;
	criteria2['stat'] = req.body.stat;
	criteria2['OwnerCode'] = req.body.OwnerCode;
	criteria2['BuyberCode'] = req.body.BuyberCode;
	var criteria3 = {$set:criteria2};
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to offer');
      assert.equal(null,err);
      updateoffer(db, criteria1, criteria3, req.body.OwnerCode, req.body.BuyberCode, function(result){
    		db.close();
    		console.log("updateoffer result: "+JSON.stringify(result));
    		if(result==true){
    			res.status(200);
    			reresult['status'] = "update offer success";
    			res.send(reresult);
    			res.end();
    		}else{
    			res.status(400);
    			reresult['status'] = "update offer fail";
    			res.send(reresult);
    			res.end();
    		}
    	});
	});
});


app.post('/api/delproduct', function(req,res){
	console.log("delproduct: "+JSON.stringify(req.body));
	var criteria = {"_id":ObjectId(req.body._id)};
	MongoClient.connect(mongourl,function(err,db) {
      console.log('connecting to product');
      assert.equal(null,err);
      updateproduct(db, criteria, function(result){
    		db.close();
    		console.log("delproduct: "+JSON.stringify(result));
    		if(result==true){
    			res.status(200);
    			reresult['status'] = "del success";
    			res.send(reresult);
    			res.end();
    		}else{
    			res.status(400);
    			reresult['status'] = "del fail";
    			res.send(reresult);
    			res.end();    		
    		}
		});
    });
});


app.get('/api/logout',function(req,res) {
	var reresult = {};
	req.session = null;
	res.status(200);
	reresult['status'] = 'logout success';
	res.send(reresult);
});
app.get('/api/list', function(req,res){
	MongoClient.connect(mongourl, function(err, db){
		assert.equal(err, null);
		console.log('connecting to product');
		var criteria = null;
		listproduct(db, criteria, function(product){
			db.close();
			res.send(product);
			res.end();
		});
	});
});
app.get('/api/list/:criteria1/:criteria2', function(req,res){
	var criteria = {};
	criteria[req.params.criteria1] = req.params.criteria2;
	console.log(criteria);
	MongoClient.connect(mongourl, criteria, function(err, db){
		assert.equal(err, null);
		console.log('connecting to product');
		listproduct(db, criteria, function(product){
			if(product != null){
			db.close();
			res.send(product);
			res.end();
			}else{
			res.send({});
			res.end();
		}
		});
	});
});

app.get('/api/listoffer', function(req,res){
	MongoClient.connect(mongourl, function(err, db){
		assert.equal(err, null);
		console.log('connecting to offer');
		var criteria = null;
		listproduct(db, criteria, function(offer){
			db.close();
			res.send(offer);
			res.end();
		});
	});
});


function login(db, criteria, pw, callback){
	var result = false;
	console.log(criteria);
	db.collection('user').findOne(criteria, function(err,doc){
		assert.equal(err,null);
		if(doc!=null){
			if(doc.pw == pw){
				result = doc;			
			}		
		}
		callback(result);
	});
}
function updateac(db, criteria1, criteria2, callback){
	console.log(criteria1);
	console.log(criteria2);	
	db.collection('user').updateOne(criteria1, criteria2, function(err,result){
		if (err) {
      			result = err;
      			console.log("updateOne error: " + JSON.stringify(err));
    		} else {
      			console.log("update success");
      			result = true;
    		}

    		callback(result);
	});
}
function updateproduct(db, criteria1, criteria2, callback){
	//console.log(criteria1);
	//console.log(criteria2);
	db.collection('product').updateOne(criteria1,criteria2,function(err,result){
		if (err) {
      			result = err;
      			console.log("updateOne error: " + JSON.stringify(err));
    		} else {
      			console.log("update success");
      			result = true;
    		}
    		callback(result);
	});	
}
function updateoffer(db, criteria1, criteria2, owner, buyer, callback){
	db.collection('user').findOne(criteria1,{'OwnerCode':owner},{'BuyberCode':buyer},function(err,result){
		assert.equal(err,null);
		if(doc==null){
			callback(false);
		}else{
			db.collection('offer').updateOne(criteria1,criteria2,function(err,result){
				if (err) {
      			result = err;
      			console.log("updateOne error: " + JSON.stringify(err));
    		} else {
      			console.log("update success");
      			result = true;
    		}
    		callback(result);
			});	
		}
	});
}
function delproduct(db, criteria, callback){
	db.collection('product').remove(criteria,function(err,result) {
	if(err){
		result = err;
	}else{
		result = true
	}
	callback(result);
	});
}
function listproduct(db, criteria, callback){
	if (!criteria){
		db.collection('product').find().toArray(function(err, result){
			assert.equal(err,null);
			callback(result);
	});
	}else{
		console.log(criteria)
		db.collection('product').find(criteria).toArray(function(err, result){
			assert.equal(err,null);
			callback(result);
	});
	}
}
function listoffer(db, criteria, callback){
	if (!criteria){
		db.collection('offer').find().toArray(function(err, result){
			assert.equal(err,null);
			callback(result);
	});
	}else{
		console.log(criteria)
		db.collection('offer').find(criteria).toArray(function(err, result){
			assert.equal(err,null);
			callback(result);
	});
	}
}

function addproduct(db, body, callback){
	db.collection('product').insertOne(body,function(err,result){
	if (err) {
      	console.log('insertOne Error: ' + JSON.stringify(err));
      	result = err;
    } else {
      	console.log("Inserted _id = " + result.insertId);
      	result = true;
    }
    	callback(result);
	});
}
function addoffer(db, body, callback){
	db.collection('offer').insertOne(body, function(err, result){
	if (err) {
      	console.log('insertOne Error: ' + JSON.stringify(err));
      	result = err;
    } else {
      	console.log("Inserted _id = " + result.insertId);
      	result = true;
    }
    	callback(result);
	});
}
function createac(db, userid, pw, email, body, callback){
	console.log(body);
	db.collection('user').findOne({$or:[{'userid':userid},{'email':email}]}, function(err,doc){
		assert.equal(err,null);
		if(doc!=null){
			callback(false);
		}else{
			db.collection('user').insertOne(body,function(err,result){
				if (err) {
      				console.log('insertOne Error: ' + JSON.stringify(err));
      				callback(false);
    			} else {
      				console.log("Inserted _id = " + result.insertId);
    			}
    			callback(true);
			});
		}
	});
}

app.listen(process.env.PORT || 8099);