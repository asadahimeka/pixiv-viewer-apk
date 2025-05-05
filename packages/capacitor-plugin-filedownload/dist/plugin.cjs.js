'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@capacitor/core');

const FileDownload = core.registerPlugin('FileDownload', {
    web: () => Promise.resolve().then(function () { return web; }).then(m => new m.FileDownloadWeb()),
});

class FileDownloadWeb extends core.WebPlugin {
    async download(options) {
        console.log('配置项', options);
        return { path: '' };
    }
}

var web = /*#__PURE__*/Object.freeze({
    __proto__: null,
    FileDownloadWeb: FileDownloadWeb
});

exports.FileDownload = FileDownload;
//# sourceMappingURL=plugin.cjs.js.map
