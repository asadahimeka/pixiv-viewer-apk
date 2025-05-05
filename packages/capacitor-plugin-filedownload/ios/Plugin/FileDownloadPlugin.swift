import Foundation
import Capacitor
import Alamofire
import CoreTelephony

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(FileDownloadPlugin)
public class FileDownloadPlugin: CAPPlugin {
    // private let implementation = FileDownload()

    var downloadRequest:DownloadRequest!//下载请求对象
    var _call:CAPPluginCall!
    var fileUrl:URL!
    
    var url: String!
    var fileName: String!
    
    // 重试次数
    var reTryCount = 0
    var maxRetryCount = 3

    @objc func download(_ call:CAPPluginCall) {
        self._call = call;
        self.url = call.getString("uri") ?? ""
        self.fileName = call.getString("fileName") ?? ""
        
        handlerDownload()
    }
    
    func handlerDownload(){
        let destination: DownloadRequest.Destination = { _, response in
            let documentsUrl = FileManager.default.urls(for: .documentDirectory, in: FileManager.SearchPathDomainMask.userDomainMask).first
            self.fileUrl = documentsUrl?.appendingPathComponent(self.fileName)
            
            return (self.fileUrl, [.removePreviousFile, .createIntermediateDirectories])
        }
        self.downloadRequest =  AF.download(self.url, to: destination)
        self.downloadRequest.downloadProgress(closure: self.downloadProgress)
        self.downloadRequest.responseData(completionHandler: self.downloadResponse)
    }
    
    // 下载进度
    func downloadProgress(progress: Progress) {
        self.notifyListeners("downloadProgress", data: ["progress": progress.fractionCompleted])
    }
     //根据下载状态处理
    func downloadResponse(response: AFDownloadResponse<Data>){
        switch response.result {
        case .success:
            var data = JSObject()
            data["path"] = self.fileUrl.absoluteString;
            self._call.resolve(data)
            self.reTryCount = 0;
            break;
        case .failure:
            if(self.reTryCount < 3) {
                self.reTryCount += 1;
                handlerDownload()
            }
            self._call.reject("下载失败！")
            break
        }
    }
}
