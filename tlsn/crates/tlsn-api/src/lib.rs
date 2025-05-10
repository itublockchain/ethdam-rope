use std::process::Command;
use actix_web::{get, App, HttpResponse, HttpServer};
use log::{error, info};

/// Executes a cargo example command and returns the command's stdout on success,
/// or stderr on failure.
async fn execute_example(example: &str) -> Result<String, String> {
    let mut cmd = Command::new("cargo");
    cmd.current_dir("../")
       .env("SERVER_PORT", "4000")
       .env("domain", "dummyjson.com")
       .env("path", "/test")
       .env("reveals", "status")
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
                error!("Example '{}' exited with code {}. Stderr: {}", example, code, stderr);
                Err(stderr)
            }
        }
        Err(e) => {
            error!("Failed to spawn example '{}': {}", example, e);
            Err(format!("Failed to execute command: {}", e))
        }
    }
}

/// Endpoint to generate an attestation proof via the 'attestation_prove' example.
#[get("/prove")]
async fn prove_endpoint() -> HttpResponse {
    match execute_example("attestation_prove").await {
        Ok(output) => HttpResponse::Ok().body(format!("PROVE completed successfully:\n{}", output)),
        Err(err) => HttpResponse::InternalServerError().body(format!("PROVE failed:\n{}", err)),
    }
}

/// Endpoint to present an attestation via the 'attestation_present' example.
#[get("/present")]
async fn present_endpoint() -> HttpResponse {
    match execute_example("attestation_present").await {
        Ok(output) => HttpResponse::Ok().body(format!("PRESENT completed successfully:\n{}", output)),
        Err(err) => HttpResponse::InternalServerError().body(format!("PRESENT failed:\n{}", err)),
    }
}

/// Endpoint to verify an attestation via the 'attestation_verify' example.
#[get("/verify")]
async fn verify_endpoint() -> HttpResponse {
    match execute_example("attestation_verify").await {
        Ok(output) => HttpResponse::Ok().body(format!("VERIFY completed successfully:\n{}", output)),
        Err(err) => HttpResponse::InternalServerError().body(format!("VERIFY failed:\n{}", err)),
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
