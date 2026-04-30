#!/bin/sh
set -e
# Säkerställer att data-mappen är skrivbar för appuser efter volym-montering.
# Railway (och Docker generellt) monterar volymer som root — detta fixar behörigheterna
# och droppar sedan till appuser innan servern startas.
mkdir -p /app/data
chown -R appuser:appgroup /app/data
exec su-exec appuser "$@"
