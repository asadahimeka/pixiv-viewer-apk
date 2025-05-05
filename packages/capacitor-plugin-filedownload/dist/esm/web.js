import { WebPlugin } from '@capacitor/core';
export class FileDownloadWeb extends WebPlugin {
    async download(options) {
        console.log('配置项', options);
        return { path: '' };
    }
}
//# sourceMappingURL=web.js.map