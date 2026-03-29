use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

use crate::error::{AppError, Result};

const GITHUB_LATEST_RELEASE_ENDPOINT: &str =
    "https://github.com/FruitsAI/Banana/releases/latest/download/latest.json";
const UPDATER_PUBLIC_KEY_ENV: &str = "BANANA_UPDATER_PUBLIC_KEY";
const UPDATER_PUBLIC_KEY_PLACEHOLDER: &str = "BANANA_UPDATER_PUBLIC_KEY_PLACEHOLDER";
const UNSUPPORTED_IN_APP_UPDATE_MESSAGE: &str = "当前平台暂不支持应用内更新";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateCheckResponse {
    pub available: bool,
    pub can_install_in_app: bool,
    pub current_version: String,
    pub download_url: Option<String>,
    pub latest_version: Option<String>,
    pub notes: Option<String>,
    pub published_at: Option<String>,
    pub reason: Option<String>,
    pub target: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateInstallResponse {
    pub current_version: String,
    pub latest_version: String,
    pub ready_to_restart: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum AppUpdatePlatform {
    Macos,
    Windows,
    Linux,
    Unsupported,
}

fn current_version(app: &AppHandle) -> String {
    app.package_info().version.to_string()
}

fn current_update_platform() -> AppUpdatePlatform {
    if cfg!(target_os = "macos") {
        AppUpdatePlatform::Macos
    } else if cfg!(target_os = "windows") {
        AppUpdatePlatform::Windows
    } else if cfg!(target_os = "linux") {
        AppUpdatePlatform::Linux
    } else {
        AppUpdatePlatform::Unsupported
    }
}

fn supports_in_app_update(platform: AppUpdatePlatform) -> bool {
    matches!(
        platform,
        AppUpdatePlatform::Macos | AppUpdatePlatform::Windows | AppUpdatePlatform::Linux
    )
}

fn resolve_updater_public_key() -> Option<String> {
    option_env!("BANANA_UPDATER_PUBLIC_KEY")
        .map(str::trim)
        .filter(|value| !value.is_empty() && *value != UPDATER_PUBLIC_KEY_PLACEHOLDER)
        .map(str::to_string)
        .or_else(|| {
            std::env::var(UPDATER_PUBLIC_KEY_ENV)
                .ok()
                .and_then(|value| {
                    let trimmed = value.trim();
                    if trimmed.is_empty() || trimmed == UPDATER_PUBLIC_KEY_PLACEHOLDER {
                        None
                    } else {
                        Some(trimmed.to_string())
                    }
                })
        })
}

fn map_updater_error(error: tauri_plugin_updater::Error) -> AppError {
    AppError::Update(error.to_string())
}

fn build_updater(app: &AppHandle) -> Result<tauri_plugin_updater::Updater> {
    let public_key = resolve_updater_public_key().ok_or_else(|| {
        AppError::InvalidConfig(format!(
            "更新通道未配置：缺少 {}，无法校验 GitHub Release 更新包签名。",
            UPDATER_PUBLIC_KEY_ENV
        ))
    })?;

    app.updater_builder()
        .pubkey(public_key)
        .build()
        .map_err(map_updater_error)
}

fn unsupported_platform_response(app: &AppHandle) -> AppUpdateCheckResponse {
    AppUpdateCheckResponse {
        available: false,
        can_install_in_app: false,
        current_version: current_version(app),
        download_url: None,
        latest_version: None,
        notes: None,
        published_at: None,
        reason: Some(UNSUPPORTED_IN_APP_UPDATE_MESSAGE.to_string()),
        target: None,
    }
}

pub async fn check_for_update(app: AppHandle) -> Result<AppUpdateCheckResponse> {
    if !supports_in_app_update(current_update_platform()) {
        return Ok(unsupported_platform_response(&app));
    }

    let updater = build_updater(&app)?;
    let current_version = current_version(&app);
    let update = updater.check().await.map_err(map_updater_error)?;

    Ok(match update {
        Some(update) => AppUpdateCheckResponse {
            available: true,
            can_install_in_app: true,
            current_version,
            download_url: Some(update.download_url.to_string()),
            latest_version: Some(update.version),
            notes: update.body,
            published_at: update.date.map(|date| date.to_string()),
            reason: None,
            target: Some(update.target),
        },
        None => AppUpdateCheckResponse {
            available: false,
            can_install_in_app: true,
            current_version,
            download_url: None,
            latest_version: None,
            notes: None,
            published_at: None,
            reason: None,
            target: None,
        },
    })
}

pub async fn install_update(app: AppHandle) -> Result<AppUpdateInstallResponse> {
    if !supports_in_app_update(current_update_platform()) {
        return Err(AppError::InvalidConfig(
            UNSUPPORTED_IN_APP_UPDATE_MESSAGE.to_string(),
        ));
    }

    let updater = build_updater(&app)?;
    let current_version = current_version(&app);
    let update = updater
        .check()
        .await
        .map_err(map_updater_error)?
        .ok_or_else(|| AppError::NotFound("当前已是最新版本，无需安装更新。".to_string()))?;
    let latest_version = update.version.clone();

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(map_updater_error)?;

    Ok(AppUpdateInstallResponse {
        current_version,
        latest_version,
        ready_to_restart: true,
    })
}

pub fn restart_to_apply_update(app: AppHandle) -> Result<()> {
    if !supports_in_app_update(current_update_platform()) {
        return Err(AppError::InvalidConfig(
            UNSUPPORTED_IN_APP_UPDATE_MESSAGE.to_string(),
        ));
    }

    app.request_restart();
    Ok(())
}

#[allow(dead_code)]
pub fn updater_release_endpoint() -> &'static str {
    GITHUB_LATEST_RELEASE_ENDPOINT
}

#[cfg(test)]
mod tests {
    use super::{supports_in_app_update, AppUpdatePlatform};

    #[test]
    fn supports_windows_linux_and_macos_in_app_updates() {
        assert!(supports_in_app_update(AppUpdatePlatform::Macos));
        assert!(supports_in_app_update(AppUpdatePlatform::Windows));
        assert!(supports_in_app_update(AppUpdatePlatform::Linux));
    }

    #[test]
    fn rejects_unknown_platforms_for_in_app_updates() {
        assert!(!supports_in_app_update(AppUpdatePlatform::Unsupported));
    }
}
