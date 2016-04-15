#!/usr/bin/env node

// This is just a rudimentary manual script to check that you can start a
// server programmatically.


var test = require('tape');

test('simple server test', function (t) {
    t.plan(2);

    t.equal(typeof Date.now, 'function');
    var start = Date.now();

    setTimeout(function () {
        t.equal(Date.now() - start, 100);
    }, 100);

  var gitServer = require('../main.js');
  var server = gitServer.run({port: 8965});




  setTimeout(function() {
    server.close();
  }, 5000);

});

