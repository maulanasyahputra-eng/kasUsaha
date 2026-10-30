#!/usr/bin/env bash
# Backup database harian — pasang di crontab: 0 2 * * * /var/www/nexora/deploy/backup-db.sh
set -euo pipefail
BACKUP_DIR=/var/backups/nexora
KEEP_DAYS=14
DB_NAME="${DB_NAME:-nexora}"
DB_USER="${DB_USER:-nexora}"

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/${DB_NAME}-$(date +%F_%H%M).sql.gz"
mysqldump --single-transaction --quick -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" | gzip > "$FILE"
# Rotasi
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "backup ok: $FILE"
