use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;

fn main() {
    let target_triple = env::var("TARGET").unwrap();
    // let out_dir = env::var("OUT_DIR").unwrap();

    // We are in gui-tauri/src-tauri.
    // Workspace root is ../../
    let workspace_root = Path::new("../..");
    let gui_server_manifest = workspace_root.join("gui-server/Cargo.toml");

    // Define a separate target dir for the sidecar to avoid "Waiting for file lock" deadlocks
    // when running `cargo tauri dev` (which holds a lock on the main target dir)
    let sidecar_target_dir = workspace_root.join("target/sidecar-build");

    // Check if we should skip the sidecar build (for rapid UI dev)
    if env::var("SKIP_SERVER_BUILD").is_ok() {
        // println!("cargo:warning=Skipping gui-server build because SKIP_SERVER_BUILD is set");
        tauri_build::build();
        return;
    }

    println!("cargo:rerun-if-changed=../../gui-server/src");
    println!("cargo:rerun-if-changed=../../gui-server/Cargo.toml");

    // 1. Build gui-server
    let status = Command::new("cargo")
        .args(&[
            "build",
            "--manifest-path",
            gui_server_manifest.to_str().unwrap(),
            "--bin",
            "gui-server",
            "--target",
            &target_triple, // Build for the same target as the Tauri app
        ])
        .env("CARGO_TARGET_DIR", &sidecar_target_dir)
        .status()
        .expect("Failed to run cargo build for gui-server");

    if !status.success() {
        panic!("Failed to build gui-server sidecar");
    }

    // 2. Copy the binary to source directory with the target triple
    // The binary will be in target/sidecar-build/<target-triple>/debug/gui-server (or release)
    // We assume debug for 'dev' profile, but strictly we should check PROFILE
    let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());

    // Cargo puts artifacts in `target/<triple>/<profile>` when --target is passed
    let mut binary_path = sidecar_target_dir
        .join(&target_triple)
        .join(&profile)
        .join("gui-server");

    // Windows extension
    if target_triple.contains("windows") {
        binary_path.set_extension("exe");
    }

    if !binary_path.exists() {
        // Fallback: sometimes cargo puts it directly in target/profile if host == target
        // But with --target explicit, it usually nests. Let's check without triple just in case.
        let alt_path = sidecar_target_dir.join(&profile).join("gui-server");
        if alt_path.exists() {
            binary_path = alt_path;
        }
    }

    let dest_name = format!("gui-server-{}", target_triple);
    // On windows invoke-sidecar expects .exe suffix in the KEY, or just the file has .exe?
    // Tauri docs say: filename should be `name-target-triple(.exe)`
    let dest_path = if target_triple.contains("windows") {
        Path::new(".").join(format!("{}.exe", dest_name))
    } else {
        Path::new(".").join(dest_name)
    };

    // Only copy if the file is different to avoid triggering infinite watch loops
    if !dest_path.exists() || fs::read(&binary_path).unwrap() != fs::read(&dest_path).unwrap() {
        fs::copy(&binary_path, &dest_path).expect(&format!(
            "Failed to copy sidecar binary from {:?} to {:?}",
            binary_path, dest_path
        ));
    }

    tauri_build::build()
}
