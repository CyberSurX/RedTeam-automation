# Slack Webhook Configuration Guide

This guide explains how to configure Slack webhooks for CI/CD notifications in the RedTeam Automation Platform.

## Overview

The CI/CD pipelines use Slack webhooks to send notifications about:
- Deployment status (staging and production)
- Security scan results
- Build failures and successes

## Required Secrets

You need to configure the following GitHub Secrets:

### 1. `SLACK_WEBHOOK` (General Deployments)
Used for deployment notifications in the `#deployments` channel.

### 2. `SLACK_SECURITY_WEBHOOK` (Security Alerts)
Used for security scan notifications in the `#security` channel.

---

## Setup Instructions

### Step 1: Create Slack Incoming Webhooks

1. **Go to your Slack workspace**
   - Navigate to: https://api.slack.com/apps

2. **Create a new app** (or use existing)
   - Click "Create New App"
   - Choose "From scratch"
   - Name: `CI/CD Notifications`
   - Select your workspace

3. **Enable Incoming Webhooks**
   - Click "Incoming Webhooks" in the sidebar
   - Toggle "Activate Incoming Webhooks" to ON

4. **Add New Webhook to Workspace**
   - Click "Add New Webhook to Workspace"
   - Select `#deployments` channel
   - Click "Allow"
   - Copy the webhook URL (starts with `https://hooks.slack.com/services/...`)

5. **Repeat for Security Channel**
   - Click "Add New Webhook to Workspace" again
   - Select `#security` channel
   - Click "Allow"
   - Copy this webhook URL as well

### Step 2: Add Secrets to GitHub Repository

1. **Go to your GitHub repository**
   - Navigate to: Settings → Secrets and variables → Actions

2. **Add SLACK_WEBHOOK**
   - Click "New repository secret"
   - Name: `SLACK_WEBHOOK`
   - Value: Paste the webhook URL for #deployments
   - Click "Add secret"

3. **Add SLACK_SECURITY_WEBHOOK**
   - Click "New repository secret"
   - Name: `SLACK_SECURITY_WEBHOOK`
   - Value: Paste the webhook URL for #security
   - Click "Add secret"

### Step 3: Verify Configuration

After adding the secrets, the next CI/CD run will attempt to send notifications.

---

## Notification Channels Setup (Recommended)

Create these Slack channels if they don't exist:

```
#deployments - For deployment notifications
#security    - For security scan alerts
#ci-cd       - Optional: for all CI/CD activity
```

---

## Alternative: Disable Notifications (Temporary)

If you want to disable Slack notifications temporarily:

### Option 1: Comment out notification jobs

Edit `.github/workflows/ci-cd.yml` and `.github/workflows/security-scan.yml`:

```yaml
# notify:
#   name: Send Notifications
#   runs-on: ubuntu-latest
#   needs: [deploy-production, deploy-staging]
#   if: always()
#   steps:
#     - name: Notify deployment status
#       uses: 8398a7/action-slack@v3
#       with:
#         status: ${{ job.status }}
#         channel: '#deployments'
#         webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Option 2: Use conditional execution

Add a repository variable to control notifications:

```yaml
notify:
  name: Send Notifications
  runs-on: ubuntu-latest
  needs: [deploy-production, deploy-staging]
  if: always() && vars.ENABLE_SLACK_NOTIFICATIONS == 'true'
```

Then set `ENABLE_SLACK_NOTIFICATIONS` in repository variables.

---

## Testing Notifications

To test your webhook configuration:

1. **Test with curl:**
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test notification from RedTeam Automation CI/CD"}' \
  YOUR_WEBHOOK_URL
```

2. **Trigger a workflow:**
   - Push a commit to trigger CI/CD
   - Check Slack channels for notifications

---

## Notification Examples

### Successful Deployment
```
✅ Deployment Successful
Repository: your-org/redteam-automation
Branch: main
Commit: abc123
Author: @username
```

### Security Alert
```
🔒 Security Scan Complete
Status: Warning
Found 3 medium severity vulnerabilities
Repository: your-org/redteam-automation
Commit: abc123
```

### Failed Build
```
❌ Build Failed
Repository: your-org/redteam-automation
Workflow: CI/CD Pipeline
Job: test
Commit: abc123
```

---

## Troubleshooting

### Notifications not appearing

1. **Check webhook URLs are correct**
   - Verify secrets in GitHub Settings
   - Test webhooks with curl

2. **Check Slack app permissions**
   - Ensure app has permission to post to channels
   - Reinstall app if needed

3. **Check workflow logs**
   - Look for errors in notification job
   - Common error: "Invalid webhook URL"

### Notifications going to wrong channel

- Edit the workflow files to change the `channel` parameter:
```yaml
channel: '#your-channel-name'
```

---

## Security Best Practices

1. **Never commit webhook URLs to git**
   - Always use GitHub Secrets
   - Add `.env` to `.gitignore`

2. **Use separate webhooks for different purposes**
   - Don't reuse the same webhook for deployments and security

3. **Rotate webhooks periodically**
   - Revoke old webhooks in Slack
   - Generate new ones every 6-12 months

4. **Limit webhook scope**
   - Only give app access to necessary channels
   - Review app permissions regularly

---

## Additional Resources

- [Slack Incoming Webhooks Documentation](https://api.slack.com/messaging/webhooks)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [8398a7/action-slack Action](https://github.com/8398a7/action-slack)

---

## Support

If you encounter issues:
1. Check GitHub Actions workflow logs
2. Verify Slack webhook URLs
3. Test webhooks independently with curl
4. Review Slack app permissions

For security-related notifications not working, ensure `SLACK_SECURITY_WEBHOOK` is set separately from `SLACK_WEBHOOK`.
