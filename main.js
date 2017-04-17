#!/usr/bin/env node
/**
 * Forked from https://github.com/bahamas10/node-git-http-server,
 * Author: Dave Eddy <dave@daveeddy.com>
 * License: MIT
 */

var accesslog = require('access-log');
var backend = require('git-http-backend');
var fs = require('fs-extra');
var getopt = require('posix-getopt');
var http = require('http');
var package = require('./package.json');
var path = require('path');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var url = require('url');


var server = module.exports = {

  // default opts:
  opts: {
    dir: process.cwd(),
    ip: process.env.GIT_HTTP_IP || null,
    host: process.env.GIT_HTTP_HOST || '0.0.0.0',
    port: process.env.GIT_HTTP_PORT || 8174,
    readonly: process.env.GIT_HTTP_READONLY,
    allowcreation: process.env.GIT_HTTP_ALLOWCREATION
  },

  run: function(_opts) {
    var s = server,
        opts = s.opts;

    if (_opts && typeof _opts === 'object') {
      Object.keys(_opts).forEach(function(k) {
        opts[k] = _opts[k];
      });
    }

    var dir = opts.dir;
    if (dir) {
      try {
        fs.accessSync(dir, fs.F_OK);
      }
      catch(err) {
        console.log(dir + ' does not exist, creating');
        fs.mkdirpSync(dir);
      }
      process.chdir(dir);
    }

    server.server = http.createServer(onrequest)
      .listen(opts.port, opts.host, started);
    return server.server;


    function started() {
      console.log('listening on http://%s:%d in %s',
        opts.host, opts.port, opts.dir);
    }

    function onrequest(req, res) {
      accesslog(req, res);
      var ip = req.ip || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress || 
        req.connection.socket.remoteAddress;
      if (ip != '127.0.0.1' && !(opts.ip && opts.ip == ip)) {
        console.error('Request from bad ip: ' + ip);
        res.statusCode = 403; // forbidden
        res.end();
        return;
      }

      // ensure the user isn't trying to send up a bad request
      var u = url.parse(req.url);
      if (u.pathname !== path.normalize(u.pathname)) {
        console.error('bad path: ' + u.pathname);
        res.statusCode = 400;
        res.end();
        return;
      }

      //var repo = u.pathname.replace(/(.*?\.git)\/.*$/, '$1');
      var segs = u.pathname.split('/');
      var gi = segs.findIndex(s => s.endsWith('.git'))
      if (gi < 1) {
        console.error('no .git in path: ' + u.pathname);
        res.statusCode = 400;
        res.end();
        return;        
      }
      var repo = segs.slice(1, gi + 1).join('/')
      //var repo = u.pathname.split('/')[1];
      //repo = 'wt/devdocs-server.git';
      //console.log('repo: ', repo);

      req.pipe(backend(req.url, function(err, service) {
        if (err) {
          console.error('error 1');
          res.statusCode = 500;
          res.end(err + '\n');
          return;
        }

        res.setHeader('content-type', service.type);

        if (opts.readonly && service.cmd !== 'git-upload-pack') {
          console.error('readonly error');
          res.statusCode = 403;
          res.end('server running in read-only mode\n');
          return;
        }

        if (opts.allowcreation && service.cmd == 'git-receive-pack') {
          var path = opts.dir + '/' + repo
          console.log('Creating empty repo ' + repo);
          var initBare = spawnSync('git', ['init', '--bare', path], { encoding : 'utf8' });
          console.log(initBare.stdout);
          console.error(initBare.stderr);
        }

        var ps = spawn(service.cmd, service.args.concat(repo));
        ps.stdout.pipe(service.createStream()).pipe(ps.stdin);
      })).pipe(res);
    }
  },
};

// Command-line interface
if (!module.parent) (function() {
  var usage = [
    'usage: git-http-server [-r] [-p port] [-H host] [dir]',
    '',
    'options',
    '',
    '  -h, --help           print this message and exit',
    '  -i, --ip             [env GIT_HTTP_IP] IP address of the allowed client',
    '  -H, --host <host>    [env GIT_HTTP_HOST] host on which to listen',
    '  -p, --port <port>    [env GIT_HTTP_PORT] port on which to listen',
    '  -r, --readonly       [env GIT_HTTP_READONLY] operate in read-only mode',
    '  -a, --alllowcreation [env GIT_HTTP_ALLOWCREATION] allows pushing unknown repositories',
    '  -u, --updates        check for available updates and exit',
    '  -v, --version        print the version number and exit',
  ].join('\n');

  var options = [
    'h(help)',
    'i:(ip)',
    'H:(host)',
    'p:(port)',
    'r(readonly)',
    'a(allowcreation)',
    'u(updates)',
    'v(version)'
  ].join('');
  var parser = new getopt.BasicParser(options, process.argv);

  var cmdOpts = {};
  var option;
  while ((option = parser.getopt())) {
    switch (option.option) {
      case 'h': console.log(usage); process.exit(0); break;
      case 'i': cmdOpts.ip = option.optarg; break;
      case 'H': cmdOpts.host = option.optarg; break;
      case 'p': cmdOpts.port = option.optarg; break;
      case 'r': cmdOpts.readonly = true; break;
      case 'a': cmdOpts.allowcreation = true; break;
      case 'u': // check for updates
        require('latest').checkupdate(package, function(ret, msg) {
          console.log(msg);
          process.exit(ret);
        });
        return;
      case 'v': console.log(package.version); process.exit(0); break;
      default: console.error(usage); process.exit(1); break;
    }
  }
  var args = process.argv.slice(parser.optind());
  var dir = args[0];
  cmdOpts.dir = dir

  server.run(cmdOpts);
})();
