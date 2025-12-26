# Configuration Management Database (CMDB) Architecture

**Version:** 1.0
**Last Updated:** 2025-12-24
**Status:** Design Phase
**Classification:** PRIVATE

## Overview

This document defines the CMDB architecture for site-ranch and site-satx homelab infrastructure. The CMDB serves as the single source of truth for:

- IT asset inventory (hardware, software, virtual resources)
- Configuration items (CIs) and their relationships
- Credential lifecycle tracking
- Service dependencies
- Change impact analysis

## Core Requirements

### Functional Requirements

1. **Asset Inventory Management**: Track all physical and virtual assets across both sites
2. **Relationship Mapping**: Document dependencies between configuration items
3. **Credential Lifecycle Tracking**: Monitor credential creation, usage, rotation, and retirement
4. **Change Impact Analysis**: Identify affected systems before changes
5. **Audit Trail**: Complete history of all configuration changes
6. **Self-Service Discovery**: Automated asset discovery where possible
7. **Integration Ready**: APIs for VaultWarden, Proxmox, Terraform, Ansible

### Non-Functional Requirements

1. **Self-Hosted**: Must run on Proxmox infrastructure (budget: free/open source)
2. **Lightweight**: Minimal resource consumption (homelab constraint)
3. **API-First**: RESTful API for agent integration
4. **Data Classification Aware**: Respect SECRET/SENSITIVE/PRIVATE/PUBLIC boundaries
5. **Backup-Friendly**: Simple backup/restore procedures
6. **Multi-Site Support**: Track assets at site-ranch and site-satx
7. **Agent-Accessible**: Queryable by domain expert agents

## Technology Selection

### Recommended Solution: **i-doit Open** (Primary) with **NetBox** (Alternative)

#### i-doit Open

- **Pros:**
  - True open-source CMDB (AGPLv3 license)
  - Web-based, PHP/MariaDB stack (LAMP compatible)
  - Flexible data modeling
  - ITIL-aligned
  - Active community
  - REST API available
  - Supports relationship modeling
  - Multi-tenancy for site separation

- **Cons:**
  - Pro version required for some advanced features
  - Moderate learning curve
  - German-developed (docs sometimes translated)

- **Resource Requirements:**
  - RAM: 2-4 GB
  - CPU: 2 vCPUs
  - Storage: 10-20 GB
  - Database: MariaDB 10.5+
  - Runtime: PHP 7.4+ with Apache/Nginx

#### NetBox (Alternative - DCIM focused)

- **Pros:**
  - Purpose-built for infrastructure documentation
  - Excellent network device management
  - Strong API (RESTful + GraphQL)
  - Python/Django stack
  - Active development by DigitalOcean (now Netbox Labs)
  - Superior VLAN/IP address management
  - Built-in credential storage (optional)

- **Cons:**
  - More DCIM than traditional CMDB
  - Opinionated data model (less flexible)
  - Requires PostgreSQL
  - No native ITIL process support

- **Resource Requirements:**
  - RAM: 2-4 GB
  - CPU: 2 vCPUs
  - Storage: 10-20 GB
  - Database: PostgreSQL 12+
  - Runtime: Python 3.8+, Redis

**Decision: Deploy both solutions**

- **i-doit Open**: Primary CMDB for general asset/credential tracking
- **NetBox**: Specialized DCIM for network infrastructure
- Integration between them via APIs

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Proxmox VE Cluster                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CMDB LXC Container (Debian 12)            │ │
│  │                                                        │ │
│  │  ┌──────────────┐        ┌──────────────┐           │ │
│  │  │  i-doit Open │        │   NetBox     │           │ │
│  │  │  (Primary)   │◄──────►│  (Network)   │           │ │
│  │  │              │   API  │              │           │ │
│  │  │  MariaDB     │        │  PostgreSQL  │           │ │
│  │  └──────┬───────┘        └──────┬───────┘           │ │
│  │         │                       │                    │ │
│  │         │    ┌──────────────────┴─────────┐         │ │
│  │         │    │   REST API Gateway         │         │ │
│  │         │    │   (Nginx Reverse Proxy)     │         │ │
│  │         │    └──────────┬─────────────────┘         │ │
│  └─────────┼───────────────┼──────────────────────────┘ │
│            │               │                             │
│            │               │                             │
│  ┌─────────▼───────────────▼──────────────────────────┐  │
│  │          VaultWarden LXC Container                 │  │
│  │          (Credential Backend)                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │     Proxmox VMs/Containers (Managed Assets)         │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
    ┌────▼────────────────┐         ┌────────▼─────────┐
    │  Terraform + Ansible │         │  Domain Expert   │
    │  (IaC Updates)       │         │  Agents          │
    └──────────────────────┘         └──────────────────┘
```

## Data Model Overview

### Core Entity Types

#### 1. Configuration Items (CIs)

**Physical Assets:**

- Servers (Proxmox nodes, NAS devices)
- Network Equipment (switches, routers, access points, UPS)
- Endpoints (desktops, laptops, mobile devices)
- Storage Devices (hard drives, SSDs, NVMe)

**Virtual Assets:**

- Virtual Machines (Proxmox VMs)
- Containers (LXC containers)
- Virtual Networks (VLANs, bridges)
- Storage Pools (ZFS, Ceph)

**Software/Services:**

- Operating Systems
- Applications
- Services (Docker containers, systemd services)
- Licenses

**Logical Assets:**

- IP Addresses
- DNS Entries
- SSL/TLS Certificates
- Credentials (references to VaultWarden)

#### 2. Relationships

- **Depends On**: Service depends on infrastructure
- **Runs On**: Software runs on hardware
- **Connects To**: Network connections
- **Contains**: Hierarchical containment (e.g., VM on host)
- **Backed Up By**: Backup relationships
- **Secured By**: Credential associations
- **Managed By**: Ownership/responsibility

#### 3. Credential Lifecycle Entities

**Credential Types:**

- User Accounts (human interactive)
- Service Accounts (automated processes)
- API Tokens
- SSH Keys
- SSL/TLS Certificates
- Encryption Keys
- Database Credentials

**Lifecycle States:**

- `pending` - Requested but not yet created
- `active` - In use and valid
- `expiring_soon` - Within rotation window (14 days)
- `expired` - Past rotation date, needs renewal
- `revoked` - Explicitly disabled
- `retired` - Decommissioned, kept for audit

**Tracked Attributes:**

- Created date
- Last rotation date
- Next rotation due date
- Rotation frequency (days)
- Associated CIs (what uses this credential)
- Storage location (VaultWarden item ID)
- Rotation history
- Last used date (if trackable)

## Integration Points

### 1. VaultWarden Integration

**Purpose:** CMDB tracks credential metadata; VaultWarden stores actual secrets

**Integration Method:**

- CMDB stores VaultWarden item ID (not the secret itself)
- CMDB tracks lifecycle metadata
- Agents retrieve actual credentials from VaultWarden using item ID
- Rotation reminders triggered by CMDB
- Actual rotation executed via VaultWarden API

**API Workflow:**

```python
# CMDB queries for expiring credentials
expiring_creds = cmdb.query("SELECT * FROM credentials WHERE next_rotation < NOW() + INTERVAL 14 DAY")

for cred in expiring_creds:
    # Retrieve actual secret from VaultWarden
    secret = vaultwarden.get_item(cred.vaultwarden_id)

    # Trigger rotation workflow
    homelab_admin.create_issue({
        "title": f"Rotate credential: {cred.name}",
        "type": "maintenance",
        "credential_id": cred.id,
        "priority": "medium"
    })
```

### 2. Proxmox Integration

**Purpose:** Automated discovery of VMs, containers, storage, network

**Integration Method:**

- Proxmox API polling (scheduled every 6-24 hours)
- Discover new VMs/containers automatically
- Update resource allocations (CPU, RAM, disk)
- Track VM lifecycle (created, running, stopped, deleted)
- Sync storage pool information

**Discovery Agent:**

```python
# Proxmox discovery script (runs via cron)
proxmox_api = ProxmoxAPI(endpoint, api_token)
vms = proxmox_api.cluster.resources.get(type='vm')

for vm in vms:
    cmdb.upsert_ci({
        "type": "virtual_machine",
        "name": vm['name'],
        "vmid": vm['vmid'],
        "node": vm['node'],
        "status": vm['status'],
        "cpu_cores": vm['maxcpu'],
        "memory_mb": vm['maxmem'] / 1024 / 1024,
        "last_discovered": datetime.now()
    })
```

### 3. Terraform Integration

**Purpose:** Track infrastructure-as-code managed resources

**Integration Method:**

- Terraform state parsing
- Track which resources are IaC-managed vs manually created
- Store Terraform resource ID for correlation
- Update CMDB as part of terraform apply workflow

**Post-Apply Hook:**

```hcl
# terraform/modules/vm/main.tf
resource "null_resource" "cmdb_update" {
  triggers = {
    vm_id = proxmox_vm_qemu.vm.id
  }

  provisioner "local-exec" {
    command = <<EOT
      curl -X POST ${var.cmdb_api}/api/ci \
        -H "Authorization: Bearer ${var.cmdb_token}" \
        -d '{
          "type": "virtual_machine",
          "name": "${proxmox_vm_qemu.vm.name}",
          "terraform_managed": true,
          "terraform_resource": "${proxmox_vm_qemu.vm.id}"
        }'
    EOT
  }
}
```

### 4. GitHub Issues Integration

**Purpose:** Link CMDB changes to change requests and approvals

**Integration Method:**

- CMDB changes create GitHub Issues
- Issue ID stored in CMDB change history
- Agents query CMDB for context when working on issues

### 5. Monitoring Integration (Future)

**Purpose:** Enrich alerts with CMDB context

**Integration Method:**

- Prometheus/Grafana alert includes CI ID
- Alert handler queries CMDB for:
  - CI owner/responsible party
  - Dependencies (what else might be affected)
  - Recent changes (did something change recently?)
  - Escalation path

## Credential Lifecycle Workflow

### 1. Credential Creation

```
User/Agent Request → Homelab Admin → Security Expert Review → Approval
    ↓
Create in VaultWarden (actual secret)
    ↓
Register in CMDB (metadata + VaultWarden ID)
    ↓
Associate with CIs (what will use this credential)
    ↓
Set rotation schedule
    ↓
Document in GitHub Issue
```

### 2. Credential Rotation

```
CMDB Scan (daily) → Identify expiring credentials (14 days)
    ↓
Create GitHub Issue: "Rotate credential: <name>"
    ↓
Homelab Admin assigns to Security Expert
    ↓
Security Expert generates new credential
    ↓
Update VaultWarden item (new secret)
    ↓
Update CMDB (last_rotated, next_rotation)
    ↓
Notify affected systems (if automated)
    ↓
Close GitHub Issue
```

### 3. Credential Retirement

```
CI Decommission Detected → Identify associated credentials
    ↓
Create GitHub Issue: "Retire credentials for <CI>"
    ↓
Security Expert review
    ↓
Revoke in VaultWarden (mark as revoked)
    ↓
Update CMDB state to 'retired'
    ↓
Archive in VaultWarden (move to archive folder)
    ↓
Document retirement reason
```

### 4. Credential Audit

```
Quarterly Audit Schedule
    ↓
CMDB Report: All credentials by state
    ↓
Identify anomalies:
    - Never rotated (> 365 days)
    - Not associated with any CI
    - Expired but still 'active'
    - Missing from VaultWarden
    ↓
Create GitHub Issues for remediation
    ↓
Track resolution
```

## Agent Integration

### Storage Expert

- **Queries:** Storage devices, ZFS pools, backup systems
- **Updates:** Storage capacity, health status, backup schedules
- **Credentials:** ZFS encryption keys, backup encryption keys

### Network Expert

- **Queries:** Network devices, VLANs, firewall rules, IP allocations
- **Updates:** Network topology changes, VLAN assignments
- **Credentials:** Network device admin passwords, SNMP credentials

### Compute Expert

- **Queries:** VMs, containers, resource allocations
- **Updates:** VM lifecycle events, resource changes
- **Credentials:** VM root passwords, SSH keys

### Security Expert

- **Queries:** All credential lifecycle data, CI security metadata
- **Updates:** Credential rotations, security classifications
- **Credentials:** ALL - responsible for rotation

### Monitoring Expert

- **Queries:** Monitoring targets, alert recipients, service dependencies
- **Updates:** Monitoring configuration, alert rules
- **Credentials:** SMTP credentials, API tokens for alert destinations

### Integration Expert (NEW)

- **Queries:** CI relationships, dependencies, automation status
- **Updates:** Terraform state sync, Ansible inventory sync
- **Credentials:** API tokens for automation

## Data Classification

CMDB data is classified according to the data classification framework:

| Data Type                                   | Classification | Access Control                               |
| ------------------------------------------- | -------------- | -------------------------------------------- |
| Credential secrets (actual passwords)       | **SECRET**     | VaultWarden only, never in CMDB              |
| Credential metadata (rotation dates, owner) | **PRIVATE**    | CMDB, accessible to agents with need-to-know |
| VaultWarden item IDs                        | **PRIVATE**    | CMDB, restricted to security/domain experts  |
| Asset serial numbers, purchase dates        | **PRIVATE**    | CMDB, accessible to authorized personnel     |
| Network topology, IP addresses              | **PRIVATE**    | CMDB, accessible to network/security experts |
| CI names, basic attributes                  | **PRIVATE**    | CMDB, accessible to all domain experts       |
| Publicly documented services                | **PUBLIC**     | Can be in public documentation               |

**Critical Security Rules:**

1. CMDB **NEVER** stores actual credentials (passwords, keys, tokens)
2. CMDB stores VaultWarden item IDs for reference only
3. Credential retrieval requires VaultWarden API call with proper authentication
4. CMDB backup encryption is **MANDATORY**
5. CMDB access requires authentication and audit logging

## Deployment Specifications

### LXC Container Configuration

```yaml
# Proxmox LXC Container Template
ostemplate: debian-12-standard
hostname: cmdb
cores: 2
memory: 4096 # 4GB RAM
swap: 2048
rootfs: local-lvm:20 # 20GB root filesystem
net0: name=eth0,bridge=vmbr1,tag=201,ip=10.2.1.10/24,gw=10.2.1.1
nameserver: 10.2.1.1
searchdomain: site-ranch.local
unprivileged: 1
features: nesting=1
startup: order=3 # Start after network, before VMs
```

### Software Stack

**i-doit Open Installation:**

```bash
# Base packages
apt update && apt install -y apache2 mariadb-server php php-{cli,mysql,ldap,gd,xml,zip,curl,mbstring}

# Create database
mysql -e "CREATE DATABASE idoit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER 'idoit'@'localhost' IDENTIFIED BY '<strong-password>';"
mysql -e "GRANT ALL PRIVILEGES ON idoit.* TO 'idoit'@'localhost';"

# Download and install i-doit Open
wget https://sourceforge.net/projects/i-doit/files/latest/download -O idoit.zip
unzip idoit.zip -d /var/www/html/idoit
chown -R www-data:www-data /var/www/html/idoit

# Configure Apache virtual host
# Complete web-based installation wizard
```

**NetBox Installation:**

```bash
# Install dependencies
apt update && apt install -y python3 python3-pip postgresql redis-server

# Create database
sudo -u postgres createuser -P netbox
sudo -u postgres createdb -O netbox netbox

# Install NetBox
pip3 install netbox
netbox migrate
netbox createsuperuser

# Configure systemd service
systemctl enable netbox netbox-rq
systemctl start netbox netbox-rq
```

### Backup Strategy

**Backup Scope:**

- CMDB database (MariaDB/PostgreSQL dumps)
- Configuration files (/etc/apache2, /etc/nginx)
- Application files (/var/www/html/idoit)
- API credentials (stored in VaultWarden)

**Backup Schedule:**

- Daily: Incremental database backup
- Weekly: Full database backup + file system backup
- Monthly: Long-term retention backup

**Backup Location:**

- Primary: Local ZFS snapshot (nvme-pool)
- Secondary: Proxmox Backup Server
- Tertiary: Offsite backup (encrypted)

## Access Control

### User Roles

| Role                | Access Level                 | Permissions                                          |
| ------------------- | ---------------------------- | ---------------------------------------------------- |
| **Admin**           | Full access                  | All CRUD operations, user management, system config  |
| **Domain Expert**   | Read + limited write         | Query CIs, update assigned CIs, no credential access |
| **Security Expert** | Read + credential management | Full credential lifecycle access, security audits    |
| **Automation**      | API only                     | Limited to specific CI types via API token           |
| **Read-Only**       | View only                    | Query data, generate reports, no modifications       |

### API Authentication

**Token-Based Authentication:**

- Each domain expert agent has dedicated API token
- Tokens stored in VaultWarden
- Tokens rotated every 180 days
- Token scopes limit access to specific CI types

**Example Token Permissions:**

```json
{
  "token_id": "storage-expert-api",
  "scopes": [
    "ci:read:storage_device",
    "ci:write:storage_device",
    "ci:read:zfs_pool",
    "ci:write:zfs_pool",
    "credential:read:encryption_key"
  ],
  "expires": "2026-06-24"
}
```

## Success Metrics

Track these metrics to measure CMDB effectiveness:

1. **Coverage**: % of infrastructure tracked in CMDB (Target: >95%)
2. **Accuracy**: % of CMDB data matching reality (Target: >98%)
3. **Freshness**: Average age of last CI update (Target: <7 days)
4. **Credential Compliance**: % of credentials rotated on schedule (Target: 100%)
5. **Discovery Automation**: % of CIs discovered automatically vs manual (Target: >80%)
6. **Change Correlation**: % of changes linked to GitHub Issues (Target: 100%)

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Deploy CMDB LXC container
- [ ] Install i-doit Open
- [ ] Configure database and backups
- [ ] Create initial CI types and templates
- [ ] Document manual data entry procedures

### Phase 2: Core Assets (Week 3-4)

- [ ] Manually inventory site-ranch assets
- [ ] Manually inventory site-satx assets (when available)
- [ ] Document CI relationships
- [ ] Create baseline reports

### Phase 3: Credential Integration (Week 5-6)

- [ ] Design credential lifecycle schema
- [ ] Integrate with VaultWarden API
- [ ] Import existing credentials as CMDB entries
- [ ] Set rotation schedules
- [ ] Test rotation workflow

### Phase 4: Automation (Week 7-8)

- [ ] Implement Proxmox discovery agent
- [ ] Implement Terraform integration
- [ ] Create API tokens for domain experts
- [ ] Test agent queries and updates
- [ ] Deploy NetBox for network DCIM

### Phase 5: Operations (Ongoing)

- [ ] Train domain expert agents on CMDB usage
- [ ] Establish audit schedule
- [ ] Monitor CMDB health metrics
- [ ] Iterate based on operational feedback

## References

**Open Source CMDB Solutions:**

- [i-doit Open Source IT Documentation](https://i-doit.org/en/)
- [NetBox - Network Documentation](https://netbox.dev/)
- [Top 6 Open Source CMDB Solutions (Faddom)](https://faddom.com/top-6-open-source-cmdb-solutions-and-their-pros-cons/)
- [CMDBuild - Enterprise Asset Management](https://www.cmdbuild.org/en)

**CMDB Best Practices:**

- [Configuration Management Database Guide (Flexera)](https://www.flexera.com/blog/it-visibility/understanding-configuration-management-databases-cmdbs-a-comprehensive-guide/)
- [CMDB Best Practices 2025 (Faddom)](https://faddom.com/cmdb-4-key-capabilities-pros-cons-and-best-practices-2025/)
- [How to Nail an ITIL CMDB (Invgate)](https://blog.invgate.com/itil-cmdb)

---

**Document Owner:** Integration Expert (agent) + Homelab Admin (agent)
**Review Cycle:** Quarterly
**Next Review:** 2026-03-24
**Implementation Status:** Design Phase - Pending Approval
