#!/bin/bash
BACKUP_DIR=/backups
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
mkdir -p $BACKUP_DIR
docker exec bika-db pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/bika-$TIMESTAMP.sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
echo "Backup complete: bika-$TIMESTAMP.sql.gz"
