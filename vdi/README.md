# Virtual Desktop Infrastructure

VDI infrastructure components for running Cloud Hypervisor VMs with Guacamole access.

## Components

| Service | Port | Purpose |
|---------|------|---------|
| guacd | 4822 | Apache Guacamole protocol daemon |
| ch-manager | 8090 | Cloud Hypervisor REST API wrapper |

## Quick Start

```bash
# Start VDI services
docker compose -f docker-compose.vdi.yml up -d

# Check status
docker compose -f docker-compose.vdi.yml ps

# View logs
docker compose -f docker-compose.vdi.yml logs -f
```

## Requirements

- Docker with Docker Compose v2+
- KVM support on host (`/dev/kvm` access)
- At least 8GB RAM for running VMs

## Directory Structure

```
vdi/
├── ch-manager/         # Cloud Hypervisor management service
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── images/             # VM disk images (qcow2)
├── vms/                # Running VM state
├── drive/              # Shared file transfer directory
└── record/             # Session recordings
```
