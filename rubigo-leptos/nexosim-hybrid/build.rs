use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=../router-wasm/src");
    println!("cargo:rerun-if-changed=../router-wasm/Cargo.toml");

    let status = Command::new("cargo")
        .env("CARGO_TARGET_DIR", "target/wasm-build")
        .args(&[
            "build",
            "--manifest-path",
            "../router-wasm/Cargo.toml",
            "--target",
            "wasm32-unknown-unknown",
        ])
        .status()
        .expect("Failed to run cargo build for router-wasm");

    if !status.success() {
        panic!("Failed to build WASM component");
    }
}
