# capacitor-plugin-filedownload
<p align="left">
  <a href="https://img.shields.io/badge/support-Android-516BEB?logo=android&logoColor=white&style=plastic">
    <img src="https://img.shields.io/badge/support-Android-516BEB?style=plastic">
  </a>
  <a href="https://img.shields.io/badge/support-Android-516BEB?logo=android&logoColor=white&style=plastic">
    <img src="https://img.shields.io/badge/support-IOS-516BEB?style=plastic">
  </a>
  <a href="https://www.npmjs.com/package/capacitor-plugin-filedownload">
    <img src="https://img.shields.io/npm/v/capacitor-plugin-filedownload/latest.svg">
  </a>
  <a href="https://www.npmjs.com/package/capacitor-plugin-filedownload">
    <img src="https://img.shields.io/npm/dm/capacitor-plugin-filedownload.svg"/>
  </a>
</p>
A file download plugin for capacitor3.0+

## Install

```bash
npm install @himeka/capacitor-plugin-filedownload
npx cap sync
```
eg:
```ts
import { FileDownload } from "@himeka/capacitor-plugin-filedownload";

FileDownload.download({
  uri: "http://www.xxxxx.com/file/rvh.apk",
  fileName: "release.apk"
}).then((res) => {
  console.log(res.path);
}).catch(err => {
  console.log(err);
})

/* Not implemented

const eventListener = await FileDownload.addListener('downloadProgress', data =>{
  console.log(data.progress);
})

// remove eventListener
eventListener.remove();

*/
...
```
if you wish to open the file, you can install this plugin:
https://github.com/capacitor-community/file-opener

## API

<docgen-index>

* [`download(...)`](#download)
* [`addListener('downloadProgress', ...)`](#addlistenerdownloadprogress)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### download(...)

```typescript
download(options: FileDownloadOptions) => Promise<FileDownloadResponse>
```

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#filedownloadoptions">FileDownloadOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#filedownloadresponse">FileDownloadResponse</a>&gt;</code>

--------------------


### addListener('downloadProgress', ...)

```typescript
addListener(eventName: 'downloadProgress', listenerFunc: (progress: FileDownloadProgress) => void) => Promise<PluginListenerHandle> & PluginListenerHandle
```

| Param              | Type                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'downloadProgress'</code>                                                              |
| **`listenerFunc`** | <code>(progress: <a href="#filedownloadprogress">FileDownloadProgress</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt; & <a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

--------------------


### Interfaces


#### FileDownloadResponse

| Prop       | Type                |
| ---------- | ------------------- |
| **`path`** | <code>string</code> |


#### FileDownloadOptions

| Prop           | Type                |
| -------------- | ------------------- |
| **`uri`**      | <code>string</code> |
| **`fileName`** | <code>string</code> |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### FileDownloadProgress

| Prop           | Type                |
| -------------- | ------------------- |
| **`progress`** | <code>number</code> |

</docgen-api>
