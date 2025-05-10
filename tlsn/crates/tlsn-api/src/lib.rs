use std::process::Command;

use actix_web::{post, web, App, HttpResponse, HttpServer};
use serde::Deserialize;
use log::{error, info};

/// Body’den gelen parametreleri temsil eder.
/// Eğer hiçbir body gelmezse Default impl devreye girer.

#[derive(Deserialize, Debug)]
struct RunParams {
    domain: String,
    path: String,
    reveals: String,
}

impl Default for RunParams {
    fn default() -> Self {
        RunParams {
            domain: "dummyjson.com".into(),
            path: "/test".into(),
            reveals: "status".into(),
        }
    }
}

/// `cargo run --release --example <example>` komutunu parametreye göre çalıştırır.
/// Başarıysa stdout’u, başarısızsa stderr’i döner.
async fn execute_example(example: &str, params: &RunParams) -> Result<String, String> {
    let mut cmd = Command::new("cargo");
    cmd.current_dir("../")
        // Dinamik olarak body’den gelen değerleri set ediyoruz:
        .env("SERVER_DOMAIN", &params.domain)
        .env("SERVER_PATH", &params.path)
        .env("REVEALS", &params.reveals)
        // Sabit port da burada kalabilir:
        .env("SERVER_PORT", "4000")
        .args(&["run", "--release", "--example", example]);

    match cmd.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
            let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
            if output.status.success() {
                info!("Example '{}' completed successfully", example);
                Ok(stdout)
            } else {
                let code = output.status.code().unwrap_or(-1);
                error!(
                    "Example '{}' exited with code {}. Stderr: {}",
                    example, code, stderr
                );
                Err(stderr)
            }
        }
        Err(e) => {
            error!("Failed to spawn example '{}': {}", example, e);
            Err(format!("Failed to execute command: {}", e))
        }
    }
}

/// Eğer istemci JSON body göndermediyse `params = None` olur ve `RunParams::default()` kullanılır.
#[post("/prove")]
async fn prove_endpoint(params: Option<web::Json<RunParams>>) -> HttpResponse {
    let params = params
        .map(|j| j.into_inner())
        .unwrap_or_default();

    match execute_example("attestation_prove", &params).await {
        Ok(out) => HttpResponse::Ok().body(format!("PROVE completed successfully:\n{}", out)),
        Err(err) => HttpResponse::InternalServerError()
            .body(format!("PROVE failed:\n{}", err)),
    }
}

#[post("/present")]
async fn present_endpoint(params: Option<web::Json<RunParams>>) -> HttpResponse {
    let params = params
        .map(|j| j.into_inner())
        .unwrap_or_default();

    match execute_example("attestation_present", &params).await {
        Ok(out) => HttpResponse::Ok().body(format!("PRESENT completed successfully:\n{}", out)),
        Err(err) => HttpResponse::InternalServerError()
            .body(format!("PRESENT failed:\n{}", err)),
    }
}

#[post("/verify")]
async fn verify_endpoint(params: Option<web::Json<RunParams>>) -> HttpResponse {
    let params = params
        .map(|j| j.into_inner())
        .unwrap_or_default();

    match execute_example("attestation_verify", &params).await {
        Ok(out) => HttpResponse::Ok().body(format!("VERIFY completed successfully:\n{}", out)),
        Err(err) => HttpResponse::InternalServerError()
            .body(format!("VERIFY failed:\n{}", err)),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    info!("Starting attestation server on http://127.0.0.1:8080");

    HttpServer::new(|| {
        App::new()
            .service(prove_endpoint)
            .service(present_endpoint)
            .service(verify_endpoint)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}