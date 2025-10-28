#!/bin/bash
# 將主規格 Markdown 複製到 docs 輸出位置，供 spec-kit 匯總使用。
set -euo pipefail

SOURCE_FILE="sdd-T-spec_20251002.md"
TARGET_DIR="docs/spec-kit"
TARGET_FILE="${TARGET_DIR}/specification.md"

if [[ ! -f "${SOURCE_FILE}" ]]; then
  echo "找不到規格檔：${SOURCE_FILE}" >&2
  exit 1
fi

mkdir -p "${TARGET_DIR}"
cp "${SOURCE_FILE}" "${TARGET_FILE}"

echo "已匯出 ${SOURCE_FILE} -> ${TARGET_FILE}"
