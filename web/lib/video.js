/**
 * Manages uploading and streaming of video files.
 *
 * @module video
 */
'use strict';

var fs, uploadPath, supportedTypes;

fs = require('fs');
uploadPath = __dirname + '/../public/videos';
supportedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
];

module.exports = {
    list    : list,
    request : request,
    upload  : upload
};

_checkUploadDir();

function _checkUploadDir(cb) {
    cb = cb || function () {};

    fs.stat(uploadPath, function (err, stats) {
        if (
            (err && err.errno === 34) ||
            !stats.isDirectory()
           ) {
            // if there's no error, it means it's not a directory - remove it
            if (!err) {
                fs.unlinkSync(uploadPath);
            }

            // create directory
            fs.mkdir(uploadPath, cb);
            return;
        }

        cb();
    });
}

/**
* checks upload directory, reads it, the writes stream out to it
 */
function list(stream, meta)  {
    _checkUploadDir(function () {
        fs.readdir(uploadPath, function (err, files) {
            stream.write({ files : files });
        });
    });
}

/**
* sends a file
 */
function request(client, meta) {
    var file = fs.createReadStream(uploadPath + '/' + meta.name);

    client.send(file);
}

/**
* allows user to upload a file via stream
 */
function upload(stream, meta) {
    if (!~supportedTypes.indexOf(meta.type)) {
        stream.write({ err: 'Unsupported type: ' + meta.type });
        stream.end();
        return;
    }

    var file = fs.createWriteStream(uploadPath + '/' + meta.name);
    stream.pipe(file);

    stream.on('data', function (data) {
        stream.write({ rx : data.length / meta.size });
    });

    stream.on('end', function () {
        stream.write({ end: true });
    });
}
