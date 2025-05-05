import { WebPlugin } from '@capacitor/core';
import type { FileDownloadPlugin, FileDownloadOptions, FileDownloadResponse } from './definitions';
export declare class FileDownloadWeb extends WebPlugin implements FileDownloadPlugin {
    download(options?: FileDownloadOptions): Promise<FileDownloadResponse>;
}
