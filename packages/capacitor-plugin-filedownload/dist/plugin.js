var capacitorFileDownload = (function (exports, core) {
    'use strict';

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

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, capacitorExports);
//# sourceMappingURL=plugin.js.map
