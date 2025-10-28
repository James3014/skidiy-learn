#!/bin/bash

# 從 API 專案的 OpenAPI spec 生成前端型別

# 確認 OpenAPI spec 存在
API_SPEC="../api/openapi.json"

if [ ! -f "$API_SPEC" ]; then
  echo "❌ OpenAPI spec 不存在: $API_SPEC"
  echo "請先執行 API 伺服器生成 OpenAPI spec"
  echo "或手動產生: cd ../api && pnpm exec tsx scripts/generate-openapi.ts"
  exit 1
fi

echo "✅ 找到 OpenAPI spec: $API_SPEC"

# 生成型別檔案
OUTPUT_DIR="./lib/api"
mkdir -p "$OUTPUT_DIR"

echo "🔨 生成 TypeScript 型別..."
npx openapi-typescript "$API_SPEC" -o "$OUTPUT_DIR/schema.d.ts"

if [ $? -eq 0 ]; then
  echo "✅ 型別生成成功: $OUTPUT_DIR/schema.d.ts"
else
  echo "❌ 型別生成失敗"
  exit 1
fi
