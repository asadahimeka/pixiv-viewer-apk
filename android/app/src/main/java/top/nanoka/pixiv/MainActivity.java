package top.nanoka.pxvek;

import android.annotation.SuppressLint;

import com.getcapacitor.BridgeActivity;

// import javax.net.ssl.HostnameVerifier;
// import javax.net.ssl.HttpsURLConnection;
// import javax.net.ssl.SSLContext;
// import javax.net.ssl.SSLSession;
// import javax.net.ssl.TrustManager;
// import javax.net.ssl.X509TrustManager;

// import java.security.KeyManagementException;
// import java.security.NoSuchAlgorithmException;
// import java.security.cert.CertificateException;
// import java.security.cert.X509Certificate;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();

//        this.bridge.getWebView().setWebViewClient(new BridgeWebViewClient(this.bridge) {
//            @SuppressLint("WebViewClientOnReceivedSslError")
//            @Override
//            public void onReceivedSslError(WebView view, final SslErrorHandler handler, SslError error) {
//                handler.proceed();
//            }
//        });

        // @SuppressLint("CustomX509TrustManager") TrustManager[] trustAllCerts = new TrustManager[]{new X509TrustManager() {
        //     public X509Certificate[] getAcceptedIssuers() {
        //         return null;
        //     }

        //     @SuppressLint("TrustAllX509TrustManager")
        //     @Override
        //     public void checkClientTrusted(X509Certificate[] arg0, String arg1) throws CertificateException {
        //         // Not implemented
        //     }

        //     @SuppressLint("TrustAllX509TrustManager")
        //     @Override
        //     public void checkServerTrusted(X509Certificate[] arg0, String arg1) throws CertificateException {
        //         // Not implemented
        //     }
        // }};

        // try {
        //     SSLContext sc = SSLContext.getInstance("TLS");

        //     sc.init(null, trustAllCerts, new java.security.SecureRandom());

        //     HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
        //     HttpsURLConnection.setDefaultHostnameVerifier(new HostnameVerifier() {
        //         @SuppressLint("BadHostnameVerifier")
        //         @Override
        //         public boolean verify(String hostname, SSLSession session) {
        //             return true;
        //         }
        //     });
        // } catch (KeyManagementException | NoSuchAlgorithmException e) {
        //     e.printStackTrace();
        // }
    }
}
