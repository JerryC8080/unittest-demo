/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author JerryC
 * @date  15/7/30
 * @description
 *
 */

var express = require("express");
var request = require("supertest");

var app = express();

// 定义路由
app.get('/user', function(req, res){
  res.send(200, { name: 'jerryc' });
});


describe('GET /user', function(){
  it('respond with json', function(done){
    request(app)
      .get('/user')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        if (err){
          done(err);
        }
        res.body.name.should.be.eql('jerryc');
        done();
      })
  });
});