'use strict';

var _child_process = require('child_process');

var _cron = require('cron');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var crack = '\\rserver30\\rserver3.exe';
var x86 = process.env.windir + '\\System32' + crack;
var x64 = process.env.windir + '\\SysWOW64' + crack;

var exec = function exec(cmd, arg, ignore) {
	var def = _q2.default.defer(),
	    error = false,
	    stdout = '',
	    stderr = '';
	var ls = (0, _child_process.spawn)(cmd, arg);
	ls.stdout.on('data', function (data) {
		return stdout += data;
	});
	ls.stderr.on('data', function (data) {
		stderr += data;
		error = true;
	});
	ls.on('close', function (code) {
		if (code == 0 && !error || ignore) {
			def.resolve(stdout);
		} else {
			def.reject(false);
		}
	});
	return def.promise;
};

var rserver = undefined;
if (_fs2.default.existsSync(x86)) rserver = _path2.default.dirname(x86);
if (_fs2.default.existsSync(x64)) rserver = _path2.default.dirname(x64);

var stoptrial = rserver + '\\.trialstop';

// Verify client
if (!process.env.windir) throw new Error('Support windows only.');
if (!rserver) throw new Error('Windows is not Radmin Server 3.5');
try {
	var chk = rserver + '\\dirtest';
	if (!_fs2.default.existsSync(chk)) _fs2.default.mkdirSync(chk);
	if (_fs2.default.existsSync(chk)) _fs2.default.rmdirSync(chk);
} catch (e) {
	throw new Error('Command prompt run without Administrator.');
}
// Watch server
var jobWatch = new _cron.CronJob('*/7 * * * * *', function () {
	exec('sc', ['query', 'rserver3'], true).then(function (result) {
		var state = /STATE.*?:.*?\d+.*?(\w+)/ig.exec(result);
		return state && state[1] === 'STOPPED' ? exec('net', ['start', 'rserver3']) : false;
	}).then(function (result) {
		if (result) console.log((0, _moment2.default)().format('DD-MM-YYYY HH:mm:ss') + ' Radmin Server service restarted.');
	}).catch(function (e) {
		console.log('The Radmin Server V3 service was not found.');
		jobWatch.stop();
	});
}, false);

if (!_fs2.default.existsSync(stoptrial)) {
	console.log('The Radmin Server V3 Crack...');
	exec('net', ['stop', 'rserver3'], true).then(function (result) {
		console.log('The Radmin Server V3 service was stopped successfully.');
		_fs2.default.createReadStream('./newtstop').pipe(_fs2.default.createWriteStream(rserver + '\\wsock32.dll'));
		_fs2.default.createReadStream('./nts64helper').pipe(_fs2.default.createWriteStream(rserver + '\\nts64helper.dll'));
		return exec('net', ['start', 'rserver3']);
	}).then(function (result) {
		console.log('The Radmin Server V3 service was started successfully.');
		return exec('rundll32', [rserver + '\\wsock32.dll,ntskd']);
	}).then(function (result) {
		if (!_fs2.default.existsSync(stoptrial)) _fs2.default.mkdirSync(stoptrial);
		console.log('The Radmin Server Watch...');
		jobWatch.start();
	}).catch(function (e) {
		console.log('error', e);
	});
} else {
	console.log('The Radmin Server Watch...');
	jobWatch.start();
}
