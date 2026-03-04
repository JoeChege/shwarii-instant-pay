# SSH Key-Based Authentication & Passwordless Sudo Setup Template
## Complete Step-by-Step Guide for Production Server Access

**Version:** 1.0  
**Last Updated:** March 3, 2026  
**Purpose:** Template for setting up secure SSH key-based authentication and passwordless sudo on Linux servers  
**Tested On:** Ubuntu 22.04.5 LTS (GCP)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Local Machine Setup](#phase-1-local-machine-setup)
4. [Phase 2: Server Setup](#phase-2-server-setup)
5. [Phase 3: Testing & Verification](#phase-3-testing--verification)
6. [Phase 4: SSH Config Alias (Optional)](#phase-4-ssh-config-alias-optional)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)
9. [Teardown & Cleanup](#teardown--cleanup)
10. [Quick Reference](#quick-reference)

---

## Overview

This template provides a complete, production-ready guide for:
- **Generating SSH key pairs** on your local machine
- **Securely adding public keys** to server's `authorized_keys` file (manual method)
- **Configuring passwordless sudo** via `visudo` on the server
- **Testing and verifying** the setup works correctly
- **Creating SSH aliases** for easy connection

### Why This Approach?

- ✅ **No passwords transmitted over network** (SSH key auth only)
- ✅ **Passwordless sudo** for automation and quick server access
- ✅ **Repeatable across multiple servers** (scalable template)
- ✅ **Secure by default** (strict file permissions, no hardcoded secrets)
- ✅ **Works from any local machine** once keys are set up

### Expected Outcome

After completing this guide, you'll be able to:
```bash
# SSH login without password
ssh your-server

# Run sudo commands without password
ssh your-server sudo apt update

# Interactive terminal access (passwordless)
ssh your-server
```

---

## Prerequisites

### On Your Local Machine

Before starting, verify you have:

- **Terminal access** (bash, zsh, or compatible shell)
- **SSH client installed** (usually pre-installed on macOS/Linux)
  ```bash
  ssh -V  # Should show version
  ```
- **File permissions**: Ability to create files in `~/.ssh/`
- **OS**: macOS, Linux, or Windows with WSL2/Git Bash

### On the Server

- **SSH server running** (usually `openssh-server`)
  ```bash
  sudo systemctl status ssh
  sudo systemctl status sshd
  ```
- **User account created** (we'll use `chegenjoroge343` as example)
- **Sudo access** (needed to configure sudoers)
- **Public IP address** (for remote access)

### Information to Collect

Before proceeding, gather this information:

| Item | Example | Your Value |
|------|---------|-----------|
| **Server Public IP** | `34.122.249.119` | `____________` |
| **Server Username** | `chegenjoroge343` | `____________` |
| **Server Hostname** | `ussd-server` | `____________` |
| **SSH Port** (default) | `22` | `____________` |
| **Local Machine OS** | macOS/Linux/Windows | `____________` |

---

## Phase 1: Local Machine Setup

This phase runs **entirely on your local machine**. You will not connect to the server yet.

### Step 1.1: Generate SSH Key Pair

Open your local terminal and run:

```bash
# Create SSH directory (if it doesn't exist)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate a new ED25519 key pair (modern, secure)
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/ussd_server

# When prompted for passphrase:
# - Press Enter twice (no passphrase) for passwordless login
# OR
# - Enter a strong passphrase if you want extra security
```

**What this generates:**

| File | Purpose | Permissions | Action |
|------|---------|-------------|--------|
| `~/.ssh/ussd_server` | **Private key** (SECRET!) | `600` (readonly) | Keep on local machine only |
| `~/.ssh/ussd_server.pub` | Public key (safe to share) | `644` | Copy to server's `authorized_keys` |

**Example output:**
```
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/user/.ssh/id_ed25519): ~/.ssh/ussd_server
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/user/.ssh/ussd_server
Your public key has been saved in /home/user/.ssh/ussd_server.pub
The key fingerprint is:
SHA256:Ms3n5WjA6CVWveUcCdCf9vyQGUg5riBs2jojHrEQsQI your-email@example.com
The key's randomart image is:
+--[ED25519 256]--+
|E       .o.  .   |
|.o       ...+.   |
|+    .  . .+++   |
|..    +*.  =*..  |
|. .  +*.S.oo+o + |
| . o.o.= +.+  *  |
|  o  ..   + .  o |
|  ..+    .      .|
| ... o           |
+----[SHA256]-----+
```

### Step 1.2: Verify Key Generation

```bash
# List your SSH keys
ls -la ~/.ssh/ussd_server*

# Expected output:
# -rw------- 1 user user 419 Mar  3 13:46 /home/user/.ssh/ussd_server
# -rw-r--r-- 1 user user 104 Mar  3 13:46 /home/user/.ssh/ussd_server.pub

# View the public key content (you'll need this for the server)
cat ~/.ssh/ussd_server.pub

# Expected output:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDcz9ISOGGSB3o+uBoDepTLrxQP1ybPAWHHMOImGBlGX your-email@example.com
```

### Step 1.3: Copy Public Key Content

**Important:** You'll need the **public key content** in the next phase. Run this to copy it to your clipboard:

**On macOS:**
```bash
cat ~/.ssh/ussd_server.pub | pbcopy
```

**On Linux (with xclip):**
```bash
cat ~/.ssh/ussd_server.pub | xclip -selection clipboard
```

**On Linux (without xclip):**
```bash
# Just read and manually copy the output
cat ~/.ssh/ussd_server.pub
```

**On Windows (Git Bash):**
```bash
cat ~/.ssh/ussd_server.pub | clip
```

---

## Phase 2: Server Setup

This phase runs **on the server**. You'll manually add the public key and configure sudo.

### Step 2.1: Connect to Server

Use your existing login method (password, Google Cloud Console, etc.):

```bash
# Example: Using password-based SSH (temporary, will be replaced)
ssh chegenjoroge343@34.122.249.119

# Or use Google Cloud Shell / Console GUI
# Or directly via terminal if you have password access
```

Once logged in, you should see:
```
chegenjoroge343@ussd:~$ 
```

### Step 2.2: Create SSH Directory (if needed)

```bash
# Create .ssh directory with correct permissions
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Verify
ls -la ~ | grep ssh
# Expected: drwx------ ... .ssh
```

### Step 2.3: Add Public Key to authorized_keys

**Paste this command on the server** (replace the key string with your actual public key):

```bash
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDcz9ISOGGSB3o+uBoDepTLrxQP1ybPAWHHMOImGBlGX your-email@example.com' > ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "✅ Public key added successfully" && cat ~/.ssh/authorized_keys
```

**Steps to execute:**

1. **On local machine:** Copy your public key content (from Step 1.3)
2. **On server terminal:** Paste the command above
3. **Replace the key string:** Paste your actual public key between the quotes
4. **Press Enter:** Command should execute and show confirmation

**Expected output:**
```
✅ Public key added successfully
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDcz9ISOGGSB3o+uBoDepTLrxQP1ybPAWHHMOImGBlGX your-email@example.com
chegenjoroge343@ussd:~$
```

### Step 2.4: Verify Public Key Was Added

```bash
# Verify file exists and has correct permissions
ls -la ~/.ssh/authorized_keys

# Expected: -rw------- 1 chegenjoroge343 chegenjoroge343 104 Mar  3 13:48 /home/chegenjoroge343/.ssh/authorized_keys

# View the content
cat ~/.ssh/authorized_keys

# Should show your public key
```

### Step 2.5: Configure Passwordless Sudo

Run this command on the server:

```bash
sudo visudo -f /etc/sudoers.d/chegenjoroge343
```

**This will open a text editor.** Follow these steps:

**Step A: Add the sudo rule**
- Position cursor at the **end of the file**
- Add this line (replace `chegenjoroge343` with your username):
  ```
  chegenjoroge343 ALL=(ALL) NOPASSWD:ALL
  ```

**Step B: Save and exit**

| Editor | Keys | Steps |
|--------|------|-------|
| **nano** (default) | `Ctrl+X` | Press Ctrl+X, type `Y` for yes, press Enter |
| **vi/vim** | `Esc` `:wq` | Press Esc, type `:wq`, press Enter |
| **vim** (GUI) | `:wq!` | Press Esc, type `:wq!`, press Enter |

**Visual example (nano editor):**
```
  ┌──────────────── /etc/sudoers.d/chegenjoroge343 ────────────────┐
  │                                                                  │
  │  chegenjoroge343 ALL=(ALL) NOPASSWD:ALL                         │
  │                                                                  │
  │  ^X Read   ^O Write  ^T Spell  ^C Location ^V Page Down ^Y Help │
  │  ^K Cut    ^U Paste  ^J Justify ^W Bwd     ^Y Page Up  ^- Goto │
```

Press `Ctrl+X` → Type `Y` → Press `Enter`

### Step 2.6: Verify Sudoers Configuration

```bash
# Check that sudoers file was created correctly
sudo cat /etc/sudoers.d/chegenjoroge343

# Expected output:
# chegenjoroge343 ALL=(ALL) NOPASSWD:ALL

# Test passwordless sudo
sudo whoami

# Should return "root" WITHOUT asking for password
# Expected output:
# root
```

---

## Phase 3: Testing & Verification

This phase runs **on your local machine** to verify everything works.

### Step 3.1: Basic SSH Connection Test

```bash
# Test SSH login with explicit key file
ssh -i ~/.ssh/ussd_server chegenjoroge343@34.122.249.119 whoami

# Expected output:
# chegenjoroge343
```

**If this fails:**
- See [Troubleshooting Section](#troubleshooting) below
- Verify public key is in `~/.ssh/authorized_keys` on server (Step 2.4)
- Verify private key permissions: `chmod 600 ~/.ssh/ussd_server`

### Step 3.2: Verify SSH Key Type

```bash
# Show fingerprint of your private key
ssh-keygen -l -f ~/.ssh/ussd_server

# Expected output:
# 256 SHA256:Ms3n5WjA6CVWveUcCdCf9vyQGUg5riBs2jojHrEQsQI your-email@example.com (ED25519)
```

### Step 3.3: Test Passwordless Sudo

```bash
# Test passwordless sudo via SSH
ssh -t -i ~/.ssh/ussd_server chegenjoroge343@34.122.249.119 'sudo whoami'

# Expected output:
# root
# ✅ Passwordless Sudo: SUCCESS
```

**Note:** The `-t` flag allocates a pseudo-terminal (needed for interactive sudo).

### Step 3.4: Test Multiple Sudo Commands

```bash
# Test various sudo operations
ssh -i ~/.ssh/ussd_server chegenjoroge343@34.122.249.119 'sudo ls -la /root'

# Expected output:
# total 28
# drwx------ 4 root root 4096 Jan 31 11:58 .
# drwxr-xr-x 20 root root 4096 Jan 28 06:36 ..
# ...
```

```bash
# Test installing a package (won't actually install, just test command)
ssh -i ~/.ssh/ussd_server chegenjoroge343@34.122.249.119 'sudo apt --help' | head -5

# Expected output: Help text for apt command
```

### Step 3.5: Full End-to-End Test

```bash
# Comprehensive test script
ssh -i ~/.ssh/ussd_server chegenjoroge343@34.122.249.119 << 'EOF'
echo "=== SSH Connection Test ==="
whoami
echo "✅ SSH Connection: SUCCESS"
echo ""
echo "=== Passwordless Sudo Test ==="
sudo whoami
echo "✅ Passwordless Sudo: SUCCESS"
echo ""
echo "=== System Info ==="
sudo uname -a
echo "✅ All tests passed!"
EOF
```

**Expected output:**
```
=== SSH Connection Test ===
chegenjoroge343
✅ SSH Connection: SUCCESS

=== Passwordless Sudo Test ===
root
✅ Passwordless Sudo: SUCCESS

=== System Info ===
Linux ussd 6.8.0-1048-gcp #1048-Ubuntu SMP Mon Feb 24 16:48:42 UTC 2025 x86_64 GNU/Linux
✅ All tests passed!
```

---

## Phase 4: SSH Config Alias (Optional)

This phase creates a convenient alias so you don't have to type the full IP address and key every time.

### Step 4.1: Add SSH Config Entry

On your **local machine**, edit or create `~/.ssh/config`:

```bash
# Edit SSH config
nano ~/.ssh/config

# OR use cat to append (if file already exists)
cat >> ~/.ssh/config << 'EOF'

Host ussd-server
  HostName 34.122.249.119
  User chegenjoroge343
  IdentityFile ~/.ssh/ussd_server
  StrictHostKeyChecking accept-new
  Port 22
EOF
```

### Step 4.2: SSH Config Explained

```
Host ussd-server                    # Alias name (use: ssh ussd-server)
  HostName 34.122.249.119           # Server IP address
  User chegenjoroge343              # Default username
  IdentityFile ~/.ssh/ussd_server   # Path to private key
  StrictHostKeyChecking accept-new  # Auto-accept new hosts
  Port 22                           # SSH port (default)
```

### Step 4.3: Set Correct Permissions

```bash
# SSH config must be readable only by you
chmod 600 ~/.ssh/config

# Verify
ls -la ~/.ssh/config
# Expected: -rw------- 1 user user ...
```

### Step 4.4: Test the Alias

```bash
# Now you can simply use:
ssh ussd-server

# Which is equivalent to:
# ssh -i ~/.ssh/ussd_server chegenjoroge343@34.122.249.119

# Verify it works
ssh ussd-server whoami
# Expected output: chegenjoroge343

# Test with sudo
ssh ussd-server sudo whoami
# Expected output: root

# Interactive session
ssh ussd-server
# Should drop you into interactive shell
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Permission denied (publickey)"

**Symptoms:**
```
ssh: connect to host 34.122.249.119 port 22: Permission denied (publickey)
```

**Root Causes & Fixes:**

| Cause | Check | Fix |
|-------|-------|-----|
| Public key not on server | `ssh ussd-server cat ~/.ssh/authorized_keys` | Re-run Step 2.3 |
| Wrong private key file | `ls -la ~/.ssh/ussd_server` | Verify file exists |
| Private key permissions wrong | `ls -la ~/.ssh/ussd_server` | Run `chmod 600 ~/.ssh/ussd_server` |
| Public key doesn't match | Compare fingerprints (see below) | Re-generate new key pair |
| SSH service not running | `sudo systemctl status ssh` | Run `sudo systemctl start ssh` |

**Debug: Compare Fingerprints**

```bash
# Local machine: fingerprint of your private key
ssh-keygen -l -f ~/.ssh/ussd_server

# Server: fingerprint of public key in authorized_keys
# (requires password-based SSH access)
ssh-keygen -l -f ~/.ssh/ussd_server.pub
```

Both should show the same SHA256 hash.

#### Issue 2: "sudo: a password is required"

**Symptoms:**
```
sudo: a password is required
```

**Root Causes & Fixes:**

| Cause | Check | Fix |
|-------|-------|-----|
| Sudoers file not configured | `sudo cat /etc/sudoers.d/chegenjoroge343` | Re-run Step 2.5 |
| Wrong username in sudoers | `whoami` on server | Update sudoers file with correct username |
| Sudoers file has syntax error | Use `sudo visudo` to check | Use `sudo visudo -c` to validate |
| SSH not allocating terminal | Using `-t` flag? | Add `-t` flag: `ssh -t user@host sudo ...` |

**Validate Sudoers:**

```bash
# Check for syntax errors
sudo visudo -c

# Expected output:
# /etc/sudoers.d/chegenjoroge343: parsed OK
```

#### Issue 3: "Could not open a connection to your authentication agent"

**Symptoms:**
```
Could not open a connection to your authentication agent
```

**Solution:** This usually happens on Windows or when SSH agent isn't running. Try:

```bash
# On macOS/Linux
eval $(ssh-agent)
ssh-add ~/.ssh/ussd_server

# On Windows (Git Bash)
eval $(ssh-agent -s)
ssh-add ~/.ssh/ussd_server
```

#### Issue 4: "Timeout connecting to server"

**Symptoms:**
```
ssh: connect to host 34.122.249.119 port 22: Connection timed out
```

**Checks:**
- Is the server IP address correct?
- Is the server running? (check in cloud console)
- Is SSH port open? (check firewall rules)
- Can you ping the server? `ping 34.122.249.119`

#### Issue 5: "Remote hostname does not resolve"

**Symptoms:**
```
ssh: Could not resolve hostname ussd-server: Name or service not known
```

**Solution:** SSH config alias not working. Check:

```bash
# Verify SSH config exists and has correct syntax
cat ~/.ssh/config | grep -A 5 "Host ussd-server"

# Make sure file has no Windows line endings
file ~/.ssh/config
# Should show: ASCII text

# Verify permissions
ls -la ~/.ssh/config
# Should be: -rw------- (600)
```

---

## Security Best Practices

### Key Management

✅ **DO:**
- Keep private keys secure and backed up
- Use strong passphrases if adding one
- Rotate keys every 12 months (regenerate and replace)
- Use ED25519 keys (modern, secure)
- Set `chmod 600` on private keys
- Set `chmod 700` on `.ssh` directory

❌ **DON'T:**
- Share private keys via email or chat
- Commit private keys to Git/GitHub
- Use the same key for multiple servers (use separate keys)
- Leave passphrases in shell history
- Use RSA-1024 keys (too weak)
- Set `chmod 644` or higher on `authorized_keys`

### Sudoers Configuration

✅ **Recommended:**
```bash
# Require sudo password only for certain commands
# admin ALL=(ALL) ALL                  # Require password

# Passwordless for specific commands only
# admin ALL=(ALL) NOPASSWD:/usr/bin/apt
# admin ALL=(ALL) NOPASSWD:/usr/bin/systemctl
```

❌ **Avoid in Production:**
```bash
# Passwordless for ALL commands (what we did in this template)
# admin ALL=(ALL) NOPASSWD:ALL
# ⚠️ Only use for development/testing environments!
```

---

## Teardown & Cleanup

If you need to remove SSH access or revoke a key:

### Remove Public Key from Server

```bash
# On the server
nano ~/.ssh/authorized_keys

# Delete the line containing your public key
# Save and exit
```

### Remove Private Key from Local Machine

```bash
# On your local machine
rm ~/.ssh/ussd_server
rm ~/.ssh/ussd_server.pub

# Remove SSH config entry
nano ~/.ssh/config
# Delete the "Host ussd-server" block
```

### Remove Sudoers Configuration

```bash
# On the server
sudo rm /etc/sudoers.d/chegenjoroge343

# Verify
sudo cat /etc/sudoers.d/chegenjoroge343
# Should return: No such file or directory
```

---

## Quick Reference

### Frequently Used Commands

#### On Local Machine

```bash
# Generate key pair
ssh-keygen -t ed25519 -C "email@example.com" -f ~/.ssh/ussd_server

# Copy public key
cat ~/.ssh/ussd_server.pub | pbcopy  # macOS
cat ~/.ssh/ussd_server.pub | xclip   # Linux

# Test SSH connection
ssh -i ~/.ssh/ussd_server user@34.122.249.119 whoami

# Test passwordless sudo
ssh -t -i ~/.ssh/ussd_server user@34.122.249.119 'sudo whoami'

# View SSH config
cat ~/.ssh/config

# Check key fingerprint
ssh-keygen -l -f ~/.ssh/ussd_server
```

#### On Server

```bash
# Add public key (replace KEY_STRING with actual key)
echo 'KEY_STRING' > ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys

# Configure passwordless sudo
sudo visudo -f /etc/sudoers.d/USERNAME

# Verify sudoers config
sudo cat /etc/sudoers.d/USERNAME

# Check SSH service status
sudo systemctl status ssh

# Restart SSH service (if needed)
sudo systemctl restart ssh

# List authorized keys
cat ~/.ssh/authorized_keys

# Check SSH key permissions
ls -la ~/.ssh/authorized_keys
```

### One-Liner Commands

```bash
# Full test suite
ssh -i ~/.ssh/ussd_server user@34.122.249.119 << 'EOF'
echo "User:" && whoami && \
echo "Sudo:" && sudo whoami && \
echo "Disk:" && sudo df -h
EOF

# Copy key to server (if SSH already works)
cat ~/.ssh/ussd_server.pub | ssh user@34.122.249.119 'cat >> ~/.ssh/authorized_keys'

# Fix SSH key permissions everywhere
chmod 700 ~/.ssh && chmod 600 ~/.ssh/* && chmod 644 ~/.ssh/*.pub
```

---

## Checklist for Future Projects

Use this checklist when setting up a new server:

### Pre-Setup
- [ ] Collect server IP, username, port
- [ ] Verify SSH service is running on server
- [ ] Have password-based access to server (for initial setup)

### Local Machine
- [ ] Generated SSH key pair: `ssh-keygen -t ed25519 ...`
- [ ] Copied public key content: `cat ~/.ssh/KEYNAME.pub`
- [ ] Set correct permissions: `chmod 600 ~/.ssh/KEYNAME`

### Server Setup
- [ ] Created `.ssh` directory: `mkdir -p ~/.ssh && chmod 700 ~/.ssh`
- [ ] Added public key to `authorized_keys`
- [ ] Set correct permissions: `chmod 600 ~/.ssh/authorized_keys`
- [ ] Configured sudoers: `sudo visudo -f /etc/sudoers.d/USERNAME`
- [ ] Verified sudo works: `sudo whoami` → returns `root`

### Testing
- [ ] SSH login works: `ssh -i ~/.ssh/KEYNAME user@IP whoami`
- [ ] Passwordless sudo works: `ssh -t -i ~/.ssh/KEYNAME user@IP 'sudo whoami'`
- [ ] SSH config alias works: `ssh alias-name whoami`
- [ ] No password prompts appear

### Documentation
- [ ] Stored key fingerprint: `ssh-keygen -l -f ~/.ssh/KEYNAME`
- [ ] Documented server IP and username
- [ ] Backed up private key (secure location)
- [ ] Recorded SSH config alias in project README

---

## Template Variables for Future Use

When using this template for a new project, replace these variables:

| Variable | Meaning | Example | Your Value |
|----------|---------|---------|-----------|
| `YOUR_EMAIL` | Your email (for key comment) | `your-email@example.com` | `____________` |
| `KEYNAME` | SSH key filename | `ussd_server` | `____________` |
| `SERVER_IP` | Server's public IP | `34.122.249.119` | `____________` |
| `USERNAME` | Server username | `chegenjoroge343` | `____________` |
| `HOSTNAME` | Server hostname | `ussd-server` | `____________` |
| `PROJECT_NAME` | Project identifier | `ussd` | `____________` |
| `SSH_PORT` | SSH port (usually 22) | `22` | `____________` |

---

## Additional Resources

- **OpenSSH Manual:** `man ssh-keygen`
- **Sudoers Manual:** `man sudoers`
- **SSH Config Manual:** `man ssh_config`
- **ED25519 Keys:** https://linux-audit.com/ssh-rsa-keys-vs-ed25519/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Mar 3, 2026 | Initial template created |

---

## License & Usage

This template is provided as-is for internal use. Feel free to:
- ✅ Customize for your organization
- ✅ Add/remove sections as needed
- ✅ Use as training documentation
- ✅ Share with team members

---

## Support & Questions

If you encounter issues:
1. Check [Troubleshooting Section](#troubleshooting)
2. Review this template for missed steps
3. Verify all file permissions are correct
4. Check SSH service is running on server: `sudo systemctl status ssh`

---

**Last verified:** March 3, 2026 on Ubuntu 22.04.5 LTS  
**Compatibility:** Ubuntu 20.04+, Debian 10+, CentOS 8+, RHEL 8+
