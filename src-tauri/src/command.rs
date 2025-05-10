use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::collections::HashMap;
use futures_util::StreamExt;
use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    current: u64,
    total: u64,
    id: String,
}

#[tauri::command]
pub async fn download_file(
    url: &str,
    write_path: &str,
    file_name: &str,
    id: &str,
    headers: Option<HashMap<String, String>>,
    window: tauri::Window,
) -> Result<String, String> {
    let file_path = Path::new(write_path).join(file_name.replace(
        |item: char| ['\\', '/', ':', '?', '*', '"', '<', '>', '|'].contains(&item),
        "_",
    ));

    let client = reqwest::Client::new();
    let mut request = client.get(url)
        .header("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36");

    if let Some(custom_headers) = headers {
        for (key, value) in custom_headers {
            request = request.header(&key, &value);
        }
    }

    let res = request
        .send()
        .await
        .map_err(|_| "网络错误")?;

    let res_len = res.content_length().unwrap_or(0);
    if res_len == 0 {
        return Err("文件长度为 0".into());
    }

    let mut downloaded_len = 0_u64;
    let mut stream = res.bytes_stream();
    let mut file = File::create(&file_path).map_err(|_| "文件创建失败")?;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|_| "网络错误")?;

        file.write_all(&chunk).map_err(|_| "文件写入失败")?;
        downloaded_len += chunk.len() as u64;

        window
            .emit(
                "download_file_progress",
                DownloadProgress {
                    current: downloaded_len,
                    total: res_len,
                    id: id.into(),
                },
            )
            .unwrap();
    }

    Ok(file_path.to_str().unwrap().into())
}
