# -------- 1) Build aşaması --------
    FROM rust:latest AS builder
    WORKDIR /usr/src/app
    
    # 1) Yalnızca tlsn-api manifest’ini kopyala (cache için)
    COPY crates/tlsn-api/Cargo.toml crates/tlsn-api/Cargo.toml
    
    # 2) Crate bağımlılıklarını indir
    RUN cargo fetch --manifest-path crates/tlsn-api/Cargo.toml
    
    # 3) Tüm proje kodunu kopyala
    COPY . .
    
    # 4) Workspace root’daki eski Cargo.lock’u kaldır (lock v4 hatasını önler)
    RUN rm -f Cargo.lock
    
    # 5) Eğer eksikse tlsn-api/src/lib.rs stub’u yarat
    RUN mkdir -p crates/tlsn-api/src \
        && touch crates/tlsn-api/src/lib.rs
    
    # 6) Sadece tlsn-api binary’sini derle
    RUN cargo build --release \
        --manifest-path crates/tlsn-api/Cargo.toml \
        --bin tlsn-api
    
    # -------- 2) Runtime aşaması --------
    FROM debian:bookworm-slim
    
    # Sistemde ihtiyaç duyulan paketleri yükle
    RUN apt-get update \
        && apt-get install -y libssl3 ca-certificates \
        && rm -rf /var/lib/apt/lists/*
    
    WORKDIR /app
    
    # Derlenmiş ikiliyi kopyala
    COPY --from=builder /usr/src/app/target/release/tlsn-api .
    
    # İsteğe bağlı ortam değişkenleri
    ENV RUST_LOG=info \
        SERVER_PORT=4000
    
    # Uygulamanın dinleyeceği port
    EXPOSE 8080
    
    # Container ayağa kalkınca bu binary’i başlat
    ENTRYPOINT ["./tlsn-api"]