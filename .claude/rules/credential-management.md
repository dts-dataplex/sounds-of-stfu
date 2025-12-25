# Credential Management & Secure Presentation Protocol

**Version:** 1.0
**Last Updated:** 2025-12-24
**Status:** Active
**Classification:** SENSITIVE

## Overview

This document defines the credential inventory and secure presentation workflow for the site-ranch Proxmox homelab infrastructure. All credentials are classified and managed according to the security-expert agent's secrets management architecture.

## Credential Classification

All credentials follow the data classification framework:

- **SECRETS**: Never stored in git, logs, or plaintext; must be in VaultWarden/BitWarden
- **SENSITIVE**: Encrypted at rest, restricted access
- **PRIVATE**: Access controls applied, audit logging enabled
- **PUBLIC**: No special protections required

## Credential Inventory

### 1. Proxmox VE Infrastructure

#### 1.1 Proxmox VE Web UI Access
- **Type:** Administrative Account
- **Classification:** SECRETS
- **Account:** `root@pam`
- **2FA:** Required (TOTP)
- **Storage Location:** VaultWarden (local)
- **Backup Location:** BitWarden Premium
- **Usage:** Primary Proxmox administration
- **Required For:**
  - Initial Proxmox configuration
  - Emergency recovery access
  - API token generation

#### 1.2 Proxmox API Tokens
- **Type:** Service Account API Token
- **Classification:** SECRETS
- **Account:** `terraform@pve` (to be created)
- **Token Name:** `terraform-automation`
- **Storage Location:** VaultWarden (local)
- **Usage:** Terraform BPG provider authentication
- **Required For:**
  - Infrastructure as Code deployments
  - Automated resource provisioning
- **Permissions:** PVEAdmin on /

#### 1.3 SSH Keys for Proxmox Host
- **Type:** Ed25519 SSH Key Pair
- **Classification:** SECRETS
- **Key Name:** `id_ed25519_proxmox_admin`
- **Storage Location:**
  - Private key: VaultWarden + local ~/.ssh/ (encrypted disk)
  - Public key: `/root/.ssh/authorized_keys` on Proxmox host
- **Usage:** SSH access to Proxmox host
- **Required For:**
  - Emergency host access
  - Ansible playbook execution
  - Manual troubleshooting
- **Note:** Password authentication DISABLED

---

### 2. VaultWarden (Secrets Management)

#### 2.1 VaultWarden Master Password
- **Type:** Master Account
- **Classification:** SECRETS
- **Account:** Admin user (to be created during setup)
- **Storage Location:** BitWarden Premium (external backup)
- **Usage:** Access to local VaultWarden instance
- **Required For:**
  - Accessing all infrastructure secrets
  - Pipeline automation credentials
  - Service account passwords

#### 2.2 VaultWarden API Token
- **Type:** API Access Token
- **Classification:** SECRETS
- **Usage:** Automated secret retrieval for pipelines
- **Storage Location:** VaultWarden itself (bootstrap problem - see workflow)
- **Required For:**
  - Terraform local-exec provisioners
  - Ansible vault password retrieval

---

### 3. External Identity & Cloud Services

#### 3.1 Microsoft 365 / Azure Entra ID
- **Type:** Administrative Account
- **Classification:** SECRETS
- **Account:** `dataplex@dataplextechnology.net`
- **2FA:** Required (Microsoft Authenticator)
- **Storage Location:** BitWarden Premium
- **Usage:** External identity management, Copilot access
- **Required For:**
  - Cloud service management
  - External DNS (if using Azure DNS)
  - Email notifications

#### 3.2 Agent Service Account
- **Type:** Service Account
- **Classification:** SECRETS
- **Account:** `helpdesk@thisisunsafe.ai`
- **Storage Location:** VaultWarden (local)
- **Backup:** BitWarden Premium
- **Usage:** Automated agent operations (future use)
- **Required For:**
  - Automated infrastructure workflows
  - Agent-initiated changes (Phase 2+)

---

### 4. Version Control & CI/CD

#### 4.1 GitHub Personal Access Token (PAT)
- **Type:** API Token
- **Classification:** SECRETS
- **Account:** Personal GitHub account
- **Scopes Required:**
  - `repo` (full repository access)
  - `workflow` (GitHub Actions)
  - `read:org` (organization access)
- **Storage Location:** VaultWarden (local)
- **Usage:** gh CLI authentication, automation
- **Required For:**
  - Creating/managing GitHub Issues
  - Creating Pull Requests
  - GitHub Actions (if implemented)

#### 4.2 SSH Key for GitHub
- **Type:** Ed25519 SSH Key Pair
- **Classification:** SECRETS
- **Key Name:** `id_ed25519_github`
- **Storage Location:**
  - Private key: VaultWarden + local ~/.ssh/
  - Public key: GitHub account settings
- **Usage:** Git operations via SSH
- **Required For:**
  - Pushing to repository
  - Secure git clone/pull operations

---

### 5. Monitoring & Alerting

#### 5.1 SMTP Credentials for Email Alerts
- **Type:** Email Account / App Password
- **Classification:** SECRETS
- **Account:** TBD (Gmail, Microsoft 365, or custom)
- **Storage Location:** VaultWarden (local)
- **Usage:** Outbound email alerts from monitoring systems
- **Required For:**
  - Proxmox alert notifications
  - Monitoring system (Prometheus/Grafana) alerts
  - Backup job notifications

---

### 6. Network Infrastructure

#### 6.1 Ubiquiti UniFi Controller
- **Type:** Administrative Account
- **Classification:** SECRETS
- **Account:** Admin user for UniFi Dream Machine SE
- **2FA:** Recommended
- **Storage Location:** BitWarden Premium
- **Usage:** Network equipment management
- **Required For:**
  - VLAN configuration verification
  - Firewall rule implementation
  - Network troubleshooting

---

### 7. Storage & Backup

#### 7.1 ZFS Encryption Keys
- **Type:** Encryption Key Files
- **Classification:** SECRETS
- **Storage Location:**
  - Primary: VaultWarden (local) as secure note
  - Backup: BitWarden Premium
  - Emergency: Offline encrypted USB drive (stored securely)
- **Usage:** Decrypt ZFS encrypted datasets
- **Required For:**
  - System recovery after reboot
  - Emergency data access
- **Note:** Required for any encrypted ZFS pool/dataset access

#### 7.2 Backup Encryption Passphrase
- **Type:** Passphrase / Key
- **Classification:** SECRETS
- **Storage Location:**
  - Primary: VaultWarden (local)
  - Backup: BitWarden Premium
- **Usage:** Decrypt backup archives
- **Required For:**
  - Backup restoration operations
  - Disaster recovery

---

## Secure Credential Presentation Workflow

### Principle: Never Transmit Secrets in Plaintext

All credential presentation follows these protocols:

### Method 1: VaultWarden Secure Share (RECOMMENDED)

**Use Case:** Sharing credentials with human operator securely

**Workflow:**
1. Admin stores credential in VaultWarden
2. Create time-limited, view-limited secure share link
3. Send link via encrypted channel (Signal, encrypted email)
4. Recipient accesses credential via link
5. Link auto-expires after configured time/views

**Configuration:**
- Max Views: 1-3
- Expiration: 1 hour - 7 days (depending on urgency)
- Delete after access: Yes

**Example:**
```bash
# Admin creates secure send via VaultWarden CLI (bw)
bw send create --text "$(bw get password 'Proxmox Root')" \
  --name "Proxmox Root Password" \
  --maxAccessCount 1 \
  --expirationDate "2025-12-25T12:00:00Z"
```

---

### Method 2: Out-of-Band Verification

**Use Case:** Verifying credentials already in possession

**Workflow:**
1. Admin: "I will need the Proxmox root password"
2. Operator: Retrieves from personal BitWarden
3. Admin: Provides first 3 and last 3 characters for verification
4. Operator: Confirms match without transmitting full credential

**Example:**
```
Admin: "Verify Proxmox root password - starts with 'X9k' and ends with 'w2Z'"
Operator: "Confirmed"
```

---

### Method 3: Encrypted File Exchange

**Use Case:** Bulk credential setup or complex configurations

**Workflow:**
1. Admin creates credentials document (YAML/JSON)
2. Encrypt file using GPG with operator's public key
3. Share encrypted file via git repository or secure channel
4. Operator decrypts with private key

**Example:**
```bash
# Admin encrypts credential file
gpg --encrypt --recipient operator@example.com credentials.yaml

# Operator decrypts
gpg --decrypt credentials.yaml.gpg > credentials.yaml

# Operator loads into VaultWarden
bw import --format yaml credentials.yaml

# Operator securely deletes plaintext
shred -vfz -n 10 credentials.yaml
```

---

### Method 4: Interactive Terminal Session (Air-Gapped)

**Use Case:** Initial setup or emergency situations

**Workflow:**
1. Admin prepares credential requirements document (no secrets)
2. Operator generates/retrieves credentials offline
3. Operator manually enters credentials into VaultWarden
4. Verification performed via out-of-band method

**Example:**
```markdown
# Credential Requirements - Proxmox Initial Setup

## Required Credentials:
1. Proxmox root@pam password
   - Length: 24+ characters
   - Complexity: Uppercase, lowercase, numbers, symbols
   - Storage: VaultWarden item "Proxmox Root Password"

2. SSH Ed25519 Key Pair
   - Generate: `ssh-keygen -t ed25519 -C "proxmox-admin"`
   - Private key: Store in VaultWarden as secure note
   - Public key: Add to Proxmox `/root/.ssh/authorized_keys`
```

---

### Method 5: Environment Variable Injection (Automation)

**Use Case:** Pipeline automation requiring credentials

**Workflow:**
1. Credentials stored in VaultWarden
2. Pipeline retrieves credential via VaultWarden API
3. Credential injected as environment variable (never logged)
4. Process runs with credential in memory only
5. Credential cleared after process completes

**Example:**
```bash
# Terraform provider configuration
export PROXMOX_VE_ENDPOINT="https://10.2.0.1:8006"
export PROXMOX_VE_API_TOKEN="$(bw get item 'Proxmox Terraform Token' --field api_token)"

terraform apply

# Unset immediately after use
unset PROXMOX_VE_API_TOKEN
```

---

## Credential Rotation Schedule

| Credential Type | Rotation Frequency | Trigger |
|----------------|-------------------|---------|
| Root Passwords | Every 90 days | Calendar |
| API Tokens | Every 180 days | Calendar |
| SSH Keys | Every 365 days | Calendar |
| Service Account Passwords | Every 90 days | Calendar |
| Emergency Access Credentials | After every use | Event |
| Encryption Keys | Only on compromise | Event |

**Automated Reminders:** Monitoring system sends rotation reminders 14 days before expiration

---

## Credential Bootstrap Workflow

**Challenge:** How to access VaultWarden credentials when VaultWarden stores the credentials?

### Solution: One-Time Bootstrap Process

1. **Initial Setup (Day 0):**
   - Admin accesses Proxmox via console (keyboard/monitor or IPMI)
   - Sets initial root@pam password manually
   - Creates SSH key and adds to authorized_keys manually
   - Accesses Proxmox via SSH

2. **VaultWarden Installation:**
   - Deploy VaultWarden container on Proxmox
   - Create master password (stored in BitWarden Premium as backup)
   - Store all initial credentials in VaultWarden

3. **Automation Bootstrap:**
   - Create Terraform API token via Proxmox Web UI
   - Store in VaultWarden
   - Configure local environment to retrieve from VaultWarden

4. **Ongoing Operations:**
   - All new credentials stored in VaultWarden immediately
   - VaultWarden master password protected by 2FA
   - BitWarden Premium serves as recovery backup

---

## Emergency Access Procedures

### Scenario 1: VaultWarden Unavailable

**Procedure:**
1. Access BitWarden Premium (external, always available)
2. Retrieve emergency root@pam password
3. Access Proxmox Web UI
4. Diagnose VaultWarden issue
5. Restore VaultWarden from backup if necessary

### Scenario 2: Forgotten VaultWarden Master Password

**Procedure:**
1. Access BitWarden Premium
2. Retrieve VaultWarden master password backup
3. Log into VaultWarden
4. Rotate master password immediately
5. Update backup in BitWarden Premium

### Scenario 3: BitWarden Premium Unavailable

**Procedure:**
1. Access offline encrypted USB backup drive
2. Decrypt emergency credentials file
3. Use emergency root@pam password for Proxmox access
4. Restore VaultWarden from Proxmox backup
5. Verify all credentials intact

### Scenario 4: Total Credential Loss

**Prevention:**
- Encrypted USB backup drive stored in secure physical location
- Emergency credentials printed on paper, stored in safe
- Recovery procedures tested quarterly

**Recovery:**
1. Access Proxmox via console (IPMI/physical)
2. Reset root password (requires physical access/IPMI)
3. Restore VaultWarden from backup
4. Verify credential integrity
5. Conduct post-incident review

---

## Compliance & Audit

### Logging Requirements:
- All credential access logged to VaultWarden audit log
- Proxmox authentication attempts logged
- SSH access logged via syslog
- Unusual access patterns trigger alerts

### Audit Schedule:
- Monthly: Review VaultWarden access logs
- Quarterly: Verify credential inventory completeness
- Annually: Full credential rotation and security review

### Documentation Requirements:
- All new credentials documented in this inventory within 24 hours
- Credential changes logged in GitHub Issues
- Emergency access events documented in incident reports

---

## Security Hardening Checklist

- [ ] All Proxmox administrative accounts use 2FA (TOTP)
- [ ] SSH password authentication disabled on all systems
- [ ] Ed25519 keys used exclusively (no RSA or ECDSA)
- [ ] VaultWarden master password >24 characters, high entropy
- [ ] VaultWarden accessible only from management VLAN
- [ ] API tokens use least-privilege permissions
- [ ] Credential rotation reminders configured
- [ ] Emergency backup stored offline in secure location
- [ ] BitWarden Premium 2FA enabled (Microsoft Authenticator)
- [ ] GitHub account 2FA enabled (hardware key preferred)

---

## Credential Setup Checklist for New Infrastructure

When setting up the Proxmox infrastructure, complete credentials in this order:

### Phase 1: Initial Access
- [ ] Set Proxmox root@pam password (via console)
- [ ] Generate SSH key pair for Proxmox access
- [ ] Add SSH public key to Proxmox authorized_keys
- [ ] Verify SSH access works
- [ ] Store credentials in temporary secure location

### Phase 2: VaultWarden Deployment
- [ ] Deploy VaultWarden container on Proxmox
- [ ] Create VaultWarden master password
- [ ] Store VaultWarden master password in BitWarden Premium
- [ ] Migrate all temporary credentials to VaultWarden
- [ ] Verify VaultWarden backups configured

### Phase 3: Automation Setup
- [ ] Create Proxmox API token for Terraform
- [ ] Store API token in VaultWarden
- [ ] Configure Terraform to retrieve token from VaultWarden
- [ ] Test Terraform authentication
- [ ] Generate GitHub PAT
- [ ] Store GitHub PAT in VaultWarden

### Phase 4: Monitoring & Alerting
- [ ] Configure SMTP credentials for alerts
- [ ] Store SMTP credentials in VaultWarden
- [ ] Test email alert delivery
- [ ] Configure credential rotation reminders

### Phase 5: Backup & Recovery
- [ ] Generate backup encryption passphrase
- [ ] Store in VaultWarden and BitWarden Premium
- [ ] Create encrypted USB emergency backup
- [ ] Test recovery procedure
- [ ] Document recovery steps

---

## Quick Reference: Credential Presentation Methods

| Scenario | Recommended Method | Security Level | Example |
|----------|-------------------|----------------|---------|
| One-time credential share | VaultWarden Send | High | Initial setup password |
| Verification only | Out-of-band verification | High | Password confirmation |
| Bulk credential setup | Encrypted file exchange | High | Full credential export |
| Emergency access | Interactive terminal | Medium | Console password reset |
| Pipeline automation | Environment variable injection | High | Terraform API token |
| Documentation | Credential requirements (no secrets) | Safe | Setup checklist |

**NEVER:**
- Transmit credentials via unencrypted email
- Store credentials in git repositories
- Include credentials in chat transcripts
- Display credentials in screenshots
- Write credentials in plaintext documentation

---

**Document Owner:** Security Expert
**Review Cycle:** Quarterly
**Next Review:** 2026-03-24
**Incident Response:** Immediately escalate any credential compromise to human operator
