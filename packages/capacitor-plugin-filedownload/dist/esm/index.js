import { registerPlugin } from '@capacitor/core';
const FileDownload = registerPlugin('FileDownload', {
    web: () => import('./web').then(m => new m.FileDownloadWeb()),
});
export * from './definitions';
export { FileDownload };
//# sourceMappingURL=index.js.map