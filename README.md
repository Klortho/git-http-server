git-http-server
===============

Serve a directory of Git repositories over HTTP.

This tool is a thin wrapper around
[git-http-backend](https://github.com/substack/git-http-backend).

To set it up:

```
npm install -g @klortho/git-http-server
```

For usage information:

```
git-http-server --help
```

In addition to the command-line options, you can also control options with
environment variables. These are also describe in the usage message. 
Command-line options take precedence.

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
listening on http://0.0.0.0:8174 in /Users/dave/dev/node-git-http-server/repos
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

## This fork

The main changes in this fork are:

* The addition of a switch to restrict the clients by IP address
* Added a programmatic interface - see test/test.js for an example.


## License

MIT License
