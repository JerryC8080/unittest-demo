/**
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * http://www.bigertech.com/
 * @author JerryC
 * @date  15/7/25
 * @description
 *
 */
var Promise = require("bluebird");

describe('should', function () {
  describe('#Promise', function () {
    it('should.reject', function () {
      (new Promise(function (resolve, reject) {
        reject(new Error('wrong'));
      })).should.be.rejectedWith('wrong');
    });

    it('should fulfilled', function () {
      (new Promise(function (resolve, reject) {
        resolve({username: 'jc', age: 18, gender: 'male'})
      })).should.be.fulfilled().then(function (it) {
          it.should.have.property('username', 'jc');
        })
    });
  });
});