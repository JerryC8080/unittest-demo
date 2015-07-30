# unittest-demo

![building pass](https://travis-ci.org/JerryC8080/unittest-demo.svg)

在团队合作中，你写好了一个函数，供队友使用，跑去跟你的队友说，你传个A值进去，他就会返回B结果了。过了一会，你队友跑过来说，我传个A值却返回C结果，怎么回事？你丫的有没有测试过啊？

大家一起写个项目，难免会有我要写的函数里面依赖别人的函数，但是这个函数到底值不值得信赖？单元测试是衡量代码质量的一重要标准，纵观Github的受欢迎项目，都是有test文件夹，并且buliding-pass的。如果你也为社区贡献过module，想更多人使用的话，加上单元测试吧，让你的module值得别人信赖。

要在Nodejs中写单元测试的话，你需要知道用什么测试框架，怎么测试异步函数，怎么测试私有方法，怎么模拟测试环境，怎么测试依赖HTTP协议的web应用，需要了解TDD和BDD，还有需要提供测试的覆盖率。


## 目录

1. 测试框架
2. 断言库
3. 需求变更
4. 异步测试
5. 异常测试
6. 测试私有方法
7. 测试Web应用
8. 覆盖率
9. 使用Makefile把测试串起来
10. 持续集成，Travis-cli
11. 一些观点
12. 彩蛋
13. 整理



## 测试框架

Nodejs的测试框架还用说？大家都在用，Mocha。

Mocha 是一个功能丰富的Javascript测试框架，它能运行在Node.js和浏览器中，支持**BDD**、**TDD**、**QUnit**、**Exports**式的测试，本文主要示例是使用更接近与思考方式的BDD，如果了解更多可以访问Mocha的[官网](http://mochajs.org/)

#### 

#### 测试接口

Mocha的BDD接口有：

- `describe()`
- `it()`
- `before()`
- `after()`
- `beforeEach()`
- `afterEach()`



#### 安装

`npm install mocha -g`



#### 编写一个稳定可靠的模块

模块具备limit方法，输入一个数值，小于0的时候返回0，其余正常返回

``` javascript
exports.limit = function (num) {
  if (num < 0) {
    return 0;
  }
  return num;
};
```



#### 目录分配

- `lib`，存放模块代码的地方
- `test`，存放单元测试代码的地方
- `index.js`，向外导出模块的地方
- `package.json`，包描述文件



#### 测试

``` javascript
var lib = require('index');

describe('module', function () {
  describe('limit', function () {
    it('limit should success', function () {
      lib.limit(10);
    });
  });
});
```



#### 结果

在当前目录下执行`mocha`：

```
$ mocha

  ․

  ✔ 1 test complete (2ms)
```



## 断言库

上面的代码只是运行了代码，并没有对结果进行检查，这时候就要用到断言库了，Node.js中常用的断言库有：

- should.js
- expect.js
- chai



#### 加上断言

使用`should`库为测试用例加上断言

``` javascript
it('limit should success', function () {
  lib.limit(10).should.be.equal(10);
});
```



## 需求变更

需求变更啦： `limit`这个方法还要求返回值大于100时返回100。

针对需求重构代码之后，正是测试用例的价值所在了，

它能确保你的改动对原有成果没有造成破坏。

但是，你要多做的一些工作的是，需要为新的需求编写新的测试代码。



## 异步测试

#### 测试异步回调

lib库中新增async函数：

``` javascript
exports.async = function (callback) {
  setTimeout(function () {
    callback(10);
  }, 10);
};
```

测试异步代码：

``` javascript
describe('async', function () {
  it('async', function (done) {
    lib.async(function (result) {
      done();
    });
  });
});
```



#### 测试Promise

使用should提供的Promise断言接口:

- `finally` | `eventually`
- `fulfilled`
- `fulfilledWith`
- `rejected`
- `rejectedWith`
- `then`

测试代码

``` javascript
describe('should', function () {
  describe('#Promise', function () {
    it('should.reject', function () {
      (new Promise(function (resolve, reject) {
        reject(new Error('wrong'));
      })).should.be.rejectedWith('wrong');
    });

    it('should.fulfilled', function () {
      (new Promise(function (resolve, reject) {
        resolve({username: 'jc', age: 18, gender: 'male'})
      })).should.be.fulfilled().then(function (it) {
          it.should.have.property('username', 'jc');
        })
    });
  });
});
```



#### 异步方法的超时支持

Mocha的超时设定默认是2s，如果执行的测试超过2s的话，就会报timeout错误。

可以主动修改超时时间，有两种方法。



#### 命令行式

`mocha -t 10000`



#### API式

``` javascript
describe('async', function () {
  this.timeout(10000);
  it('async', function (done) {
    lib.async(function (result) {
      done();
    });
  });
});
```

这样的话`async`执行时间不超过10s，就不会报错timeout错误了。



## 异常测试

异常应该怎么测试，现在有`getContent`方法，他会读取指定文件的内容，但是不一定会成功，会抛出异常。

``` javascript
exports.getContent = function (filename, callback) {
  fs.readFile(filename, 'utf-8', callback);
};
```

这时候就应该模拟(mock)错误环境了

#### 简单Mock

``` javascript
describe("getContent", function () {
  var _readFile;
  before(function () {
    _readFile = fs.readFile;
    fs.readFile = function (filename, encoding, callback) {
      process.nextTick(function () {
        callback(new Error("mock readFile error"));
      });
    };
  });
  // it();
  after(function () {
    // 用完之后记得还原。否则影响其他case
    fs.readFile = _readFile;
  })
});
```



#### Mock库

Mock小模块：[`muk`](https://github.com/fent/node-muk) ，略微优美的写法：

``` javascript
var fs = require('fs');
var muk = require('muk');

before(function () {
  muk(fs, 'readFile', function(path, encoding, callback) {
    process.nextTick(function () {
      callback(new Error("mock readFile error"));
    });
  });
});
// it();
after(function () {
  muk.restore();
});
```



## 测试私有方法

针对一些内部的方法，没有通过exports暴露出来，怎么测试它？

``` javascript
function _adding(num1, num2) {
  return num1 + num2;
}
```

#### 通过rewire导出方法

模块：[`rewire`](http://jhnns.github.com/rewire/)

```
it('limit should return success', function () {
  var lib = rewire('../lib/index.js');
  var litmit = lib.__get__('limit');
  litmit(10);
});
```



## 测试Web应用

在开发Web项目的时候，要测试某一个API，如：`/user`，到底怎么编写测试用例呢？

使用：[`supertest`](https://github.com/visionmedia/supertest)

``` javascript
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
```



## 覆盖率

测试的时候，我们常常关心，是否所有代码都测试到了。

这个指标就叫做["代码覆盖率"](http://en.wikipedia.org/wiki/Code_coverage)（code coverage）。它有四个测量维度。

> - **行覆盖率**（line coverage）：是否每一行都执行了？
> - **函数覆盖率**（function coverage）：是否每个函数都调用了？
> - **分支覆盖率**（branch coverage）：是否每个if代码块都执行了？
> - **语句覆盖率**（statement coverage）：是否每个语句都执行了？

[Istanbul](https://github.com/gotwarlost/istanbul) 是 JavaScript 程序的代码覆盖率工具。

#### 安装

`$ npm install -g istanbul`



#### 覆盖率测试

在编写过以上的测试用例之后，执行命令：

`istanbul cover _mocha`

就能得到覆盖率:

``` javascript
JerryC% istanbul cover _mocha


  module
    limit
      ✓ limit should success
    async
      ✓ async
    getContent
      ✓ getContent
    add
      ✓ add

  should
    #Promise
      ✓ should.reject
      ✓ should fulfilled


  6 passing (32ms)


================== Coverage summary ======================
Statements   : 100% ( 10/10 )
Branches     : 100% ( 2/2 )
Functions    : 100% ( 5/5 )
Lines        : 100% ( 10/10 )
==========================================================
```

这条命令同时还生成了一个 coverage 子目录，其中的 coverage.json 文件包含覆盖率的原始数据，coverage/lcov-report 是可以在浏览器打开的覆盖率报告，其中有详细信息，到底哪些代码没有覆盖到。

![覆盖率html](http://xia-dev.b0.upaiyun.com/eac87dbf-4e4b-426e-80ac-7c50e1b9a1cb.jpg)



上面命令中，`istanbul cover` 命令后面跟的是 `_mocha` 命令，前面的下划线是不能省略的。

因为，[mocha 和 _mocha 是两个不同的命令](https://github.com/gotwarlost/istanbul/issues/44)，前者会新建一个进程执行测试，而后者是在当前进程（即 istanbul 所在的进程）执行测试，只有这样， istanbul 才会捕捉到覆盖率数据。其他测试框架也是如此，必须在同一个进程执行测试。

如果要向 mocha 传入参数，可以写成下面的样子。

```
$ istanbul cover _mocha -- tests/test.sqrt.js -R spec
```

上面命令中，两根连词线后面的部分，都会被当作参数传入 Mocha 。如果不加那两根连词线，它们就会被当作 istanbul 的参数（参考链接[1](http://www.clock.co.uk/blog/npm-module-code-coverage-in-2-simple-steps)，[2](http://www.vapidspace.com/coding/2014/10/29/code-coverage-metrics-with-mocha-and-istanbul/)）。



## 使用Makefile串起项目 （未完成）

```
TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 10000
JSCOVERAGE = ./node_modules/jscover/bin/jscover

test:
    @NODE_ENV=test ./node_modules/mocha/bin/mocha -R $(REPORTER) -t $(TIMEOUT) $(TESTS)

test-cov: lib-cov
    @LIB_COV=1 $(MAKE) test REPORTER=dot
    @LIB_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
    @rm -rf ./lib-cov
    @$(JSCOVERAGE) lib lib-cov

.PHONY: test test-cov lib-cov

make test
make test-cov

```

用项目自身的jscover和mocha，避免版本冲突和混乱



## 持续集成，Travis-cli

- [Travis-ci](https://travis-ci.org/)
  - 绑定Github帐号
  - 在Github仓库的Admin打开Services hook
  - 打开Travis
  - 每次push将会hook触发执行`npm test`命令

注意：Travis会将未描述的项目当作Ruby项目。所以需要在根目录下加入`.travis.yml`文件。内容如下：

``` yaml
language: node_js
node_js:
  - "0.12"
```

Travis-cli还会对项目颁发标签，

![/](https://camo.githubusercontent.com/f479d6cf4ac300093da5a90d70565cebf8c8ed40/68747470733a2f2f7365637572652e7472617669732d63692e6f72672f4a61636b736f6e5469616e2f626167706970652e706e67)or ![/](https://camo.githubusercontent.com/08478cd5a732822aec47e6e60d5f823ef0898dec/68747470733a2f2f7365637572652e7472617669732d63692e6f72672f54424544502f64617461766a732e706e67)

如果项目通过所有测试，就会build-passing，

如果项目没有通过所有测试，就会build-failing



## 一些观点

实施单元测试的时候, 如果没有一份经过实践证明的详细规范, 很难掌握测试的 "度", 范围太小施展不开, 太大又侵犯 "别人的" 地盘. 上帝的归上帝, 凯撒的归凯撒, 给单元测试念念紧箍咒不见得是件坏事, 反而更有利于发挥单元测试的威力, 为代码重构和提高代码质量提供动力.

这份文档来自 Geotechnical, 是一份非常难得的经验准则. 你完全可以以这份准则作为模板, 结合所在团队的经验, 整理出一份内部单元测试准则.



[单元测试准则](https://github.com/yangyubo/zh-unit-testing-guidelines)



## 彩蛋

最后，介绍一个库：[`faker`](https://github.com/Marak/Faker.js)

他是一个能伪造用户数据的库，包括用户常包含的属性：个人信息、头像、地址等等。

是一个开发初期，模拟用户数据的绝佳好库。

支持Node.js和浏览器端。

![生成用户](http://xia-dev.b0.upaiyun.com/43075e5e-026f-4acb-a51f-a998cf1a6e11.jpg)

## 整理

#### Nodejs的单元测试工具

1. 测试框架 mocha
2. 断言库：should.js、expect.js、chai
3. 覆盖率：istanbul、jscover、blanket
4. Mock库：muk
5. 测试私有方法：rewire
6. Web测试：supertest
7. 持续集成：Travis-cli



## 参考

- [https://github.com/JacksonTian/unittesting](https://github.com/JacksonTian/unittesting)


- []()[http://html5ify.com/unittesting/slides/index.html](http://html5ify.com/unittesting/slides/index.html)
- [http://www.ruanyifeng.com/blog/2015/06/istanbul.html](http://www.ruanyifeng.com/blog/2015/06/istanbul.html)
- [http://coolshell.cn/articles/8209.html](http://coolshell.cn/articles/8209.html)
- [http://stackoverflow.com/questions/153234/how-deep-are-your-unit-tests](http://stackoverflow.com/questions/153234/how-deep-are-your-unit-tests)
- [https://github.com/yangyubo/zh-unit-testing-guidelines](https://github.com/yangyubo/zh-unit-testing-guidelines)
- [http://www.codedata.com.tw/java/unit-test-the-way-changes-my-programming](http://www.codedata.com.tw/java/unit-test-the-way-changes-my-programming)
- [http://wiki.ubuntu.org.cn/%E8%B7%9F%E6%88%91%E4%B8%80%E8%B5%B7%E5%86%99Makefile:MakeFile%E4%BB%8B%E7%BB%8D](http://wiki.ubuntu.org.cn/%E8%B7%9F%E6%88%91%E4%B8%80%E8%B5%B7%E5%86%99Makefile:MakeFile%E4%BB%8B%E7%BB%8D)
- [https://github.com/yangyubo/zh-unit-testing-guidelines](https://github.com/yangyubo/zh-unit-testing-guidelines)
- [https://github.com/visionmedia/superagent/blob/master/Makefile](https://github.com/visionmedia/superagent/blob/master/Makefile)
- []()
