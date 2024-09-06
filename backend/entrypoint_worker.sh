#!/bin/bash

set -xe
celery -A $TASK_MODULE worker \
  --loglevel=$LOG_LEVEL -E \
  --prefetch-multiplier=1 \
  --max-tasks-per-child=100 \
  --without-gossip --without-mingle