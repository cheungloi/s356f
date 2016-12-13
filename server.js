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
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());
app.use('/style', express.static('style'));

app.post('/api', function(req,res){
	console.log(req.body);
});

app.post('/api/login', function(req,res){
	var reresult = {};
	if(!req.body.userid || !req.body.pw){
		reresult['status'] = 'userid or pw empty';
		res.status(500);
		res.send(reresult);
		res.end();
		return;
	}
	var criteria = {"userid":req.body.userid};
	MongoClient.connect(mongourl,function(err,db) {
      console.log('Connected to mlab.com');
      assert.equal(null,err);
      login(db, criteria, req.body.pw, function(result){
      	db.close();
      	console.log(result);
      if (result) {
            res.status(200);
            req.session.authenticated = true;
			req.session.username = req.body.userid;
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
	if(!req.body.userid || !req.body.pw){
		reresult['status'] = 'userid or pw empty';
		res.status(500);
		res.send(reresult);
		res.end();
		return;
	}
	MongoClient.connect(mongourl,function(err,db) {
      console.log('Connected to mlab.com');
      assert.equal(null,err);
      createac(db, req.body.userid, req.body.pw, req.body.email, req.body, function(result){
      	db.close();
      	console.log(result);
      if (result) {
            res.status(200);
            reresult['status'] = 'createac success';
			res.send(reresult);
			res.end();
        } else {
          	res.status(500);
            reresult['status'] = 'userid or email is used';
			res.send(reresult);
			res.end();
        }
      });
    });
});
app.post('/api/updateac',function(req,res){
	var reresult = {};
	var criteria1 = {"_id":ObjectId(req.body.id)};
	var criteria2 = {$set:req.body};
	MongoClient.connect(mongourl,function(err,db) {
      console.log('Connected to mlab.com');
      assert.equal(null,err);
      updateac(db, criteria1, criteria2, function(result){
    		db.close();
    		//res.redirect('/showinfo?id='+req.body.id);
    		res.end();
    	});
	});
});
app.post('/api/addproduct', function(req,res){
	var reresult = {};
	console.log(req.body);
	MongoClient.connect(mongourl,function(err,db) {
      console.log('Connected to mlab.com');
      assert.equal(null,err);
      addproduct(db, req.body, function(result){
      	db.close();
      	console.log(result);
      if (result) {
            res.status(200);
            reresult['status'] = 'add success';
			res.send(reresult);
			res.end();
        } else {
          	res.status(500);
            reresult['status'] = 'add fail';
			res.send(reresult);
			res.end();
        }
      });
    });
});
app.get('/api/logout',function(req,res) {
	var reresult = {};
	req.session = null;
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
function addproduct(db, body, callback){
	db.collection('product').insertOne(body,function(err,result){
	if (err) {
      	console.log('insertOne Error: ' + JSON.stringify(err));
      	callback(false);
    } else {
      	console.log("Inserted _id = " + result.insertId);
    }
    	callback(true);
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