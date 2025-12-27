#!/usr/bin/env bash
# Show recent rubigo-react service logs, useful for finding init token
journalctl --user -u rubigo-react.service --since "5 minutes ago" --no-pager
