#!/usr/bin/env node

var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var simpleGit = require('simple-git');
var test = require('tape');
var tmp = os.tmpdir();

var debug = true;

test('simple server test', function (t) {
  //t.plan(2);

  var timer = setTimeout(function() {
    gitServer.server.close();
    t.end();
  }, 10000);

  var gitServer = require('../main.js');

  // Do the steps from the example
  //$ mkdir served && cd served
  //$ git init --bare foo.git
  //Initialized empty Git repository in /Users/.../repos/foo.git/
  //$ git-http-server
  //listening on http://0.0.0.0:8174 in /Users/.../repos

  // initialize a new git repo
  var served = mkfresh(tmp, 'served');
  dlog('Served directory: ', served);

  // Create a directory for a new repo
  var foo = mkfresh(served, 'foo.git');
  // New simple-git handler for a single repo
  var fooGit = simpleGit(foo);
  // git init --bar foo.git
  fooGit.init(true, function(err, data) {
    checkError(err);

    // serve it over http
    process.chdir(served);
    gitServer.run({
      dir: served, 
    });

    //$ mkdir clones && cd clones
    //$ git clone http://127.0.0.1:8174/foo.git
    //Cloning into 'foo'...
    //warning: You appear to have cloned an empty repository.
    //Checking connectivity... done.

    // Create a directory for a clone
    var clone = mkfresh(tmp, 'clone');
    // clone it
    simpleGit(clone).clone('http://127.0.0.1:8174/foo.git', 'foo', 
      function(err, data) {
        checkError(err);
        // Check its remotes
        var cgit = simpleGit(path.join(clone, 'foo'));
        cgit.getRemotes(true, function(err, data) {
          checkError(err);
          dlog('data ', data);
          t.equal(data[0].name, 'origin');
          gitServer.server.close();
          t.end();
          clearTimeout(timer);
        });
      }
    );
  });
});

//--------------------------------------------------------------------
// Utility functions

function dlog() {
  if (!debug) return;
  console.log.apply(console, arguments);
}

function mkfresh(parent, dir) {
  var _path = path.join(parent, dir);
  dlog('Making fresh directory ', _path);
  fs.removeSync(_path);
  fs.mkdirpSync(_path);
  return _path;
}

function checkError(err) {
  if (err) {
    console.error(err);
    throw err;
  }
}
