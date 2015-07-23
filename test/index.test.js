/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author JerryC
 * @date  15/7/23
 * @description
 *
 */
var lib = require("../index");
var fs = require('fs');
var muk = require("muk");
var rewire = require("rewire");

describe('module', function () {

  // 普通测试
  describe('limit', function () {
    it('limit should success', function () {
      lib.limit(10).should.be.equal(10);
      lib.limit(-1).should.be.equal(0);
    });
  });

  // 异步测试
  describe('async', function () {
    it('async', function (done) {
      lib.async(function (result) {
        done();
      });
    });
  });

  // 异常测试
  describe("getContent", function () {
    before(function () {
      muk(fs, 'readFile', function(path, encoding, callback) {
        process.nextTick(function () {
          callback(new Error("mock readFile error"));
        });
      });
    });
    it('getContent', function (done) {
      lib.getContent('text.txt', function (err, file) {
        err.should.be.ok();
        done();
      })
    });
    after(function () {
      muk.restore();
    });
  });

  // 测试私有方法
  describe('add', function () {
    it('add', function () {
      var lib = rewire('../index');
      var add = lib.__get__('_adding');
      var sum = add(1, 3);
      sum.should.equal(4);
    });
  });
});