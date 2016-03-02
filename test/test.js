#!/usr/bin/env node

// This is just a rudimentary manual script to check that you can start a
// server programmatically.

var gitServer = require('../main.js');
gitServer.run({port: 8965});
