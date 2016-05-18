# Git HTTP server

Serve a directory tree of Git repositories over HTTP.

This tool is a thin wrapper around
[git-http-backend](https://github.com/substack/git-http-backend).

## Use it in your package

Install it with

```
npm install --save git-http-server2
```

Then, in your program, for example:

```javascript
var gitServer = require('git-http-server');

var server = gitServer.run({
  ip: '129.77.66.122',
  port: 5167,
  dir: '/Users/bob/repos',
});

... do a bunch of stuff ...

server.close();
```

## Command line

To set it up to use from the command line:

```
npm install -g git-http-server2
```

For usage information:

```
git-http-server --help
```

Options can be controlled via the command-line (highest precedence) or 
environment variables. These are also describe in the usage message:

```
usage: git-http-server [-r] [-p port] [-H host] [dir]

options

  -h, --help          print this message and exit
  -i, --ip            [env GIT_HTTP_IP] IP address of the allowed client
  -H, --host <host>   [env GIT_HTTP_HOST] host on which to listen
  -p, --port <port>   [env GIT_HTTP_PORT] port on which to listen
  -r, --readonly      [env GIT_HTTP_READONLY] operate in read-only mode
  -u, --updates       check for available updates and exit
  -v, --version       print the version number and exit
```

## Examples

Start the server with one repository:

```
$ mkdir served && cd served
$ git init --bare foo.git
Initialized empty Git repository in /Users/.../repos/foo.git/
$ git-http-server
listening on http://0.0.0.0:8174 in /Users/.../repos
```

Now, from another terminal, clone the empty repository:

```
$ mkdir clones && cd clones
$ git clone http://127.0.0.1:8174/foo.git
Cloning into 'foo'...
warning: You appear to have cloned an empty repository.
Checking connectivity... done.
```

Add do some git stuff in the clone:

```
$ cd foo
$ touch bar
$ git add bar
$ git commit -m 'initial commit' bar
[master (root-commit) 9a37778] initial commit ...
$ git push origin master
Counting objects: 3, done
...
* [new branch]      master -> master
```

Meanwhile, back in the server terminal, the logs look like:

```
127.0.0.1 - - [28/Mar/2015:22:45:51 -0400] "GET /foo.git/..."
127.0.0.1 - - [28/Mar/2015:22:46:44 -0400] "GET /foo.git/..."
127.0.0.1 - - [28/Mar/2015:22:46:44 -0400] "POST /foo.git/..."
```

## Development

Clone the repo, then:

```
npm install
npm test
```

## About this fork

The main changes in this fork are:

* The addition of a switch to restrict the clients by IP address
* Added a programmatic interface - see test/test.js for an example.
* Addition of tests


## License

MIT License
