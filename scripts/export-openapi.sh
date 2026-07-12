#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_URL="${API_URL:-http://localhost:8080}"
OUTPUT_DIR="${PROJECT_ROOT}/docs/api"

mkdir -p "${OUTPUT_DIR}"

echo "Vérification de l'API..."
curl --fail --silent --show-error \
  "${API_URL}/actuator/health" \
  > /dev/null

echo "Export OpenAPI JSON..."
curl --fail --silent --show-error \
  "${API_URL}/v3/api-docs" \
  -o "${OUTPUT_DIR}/openapi.json"

echo "Export OpenAPI YAML..."
curl --fail --silent --show-error \
  "${API_URL}/v3/api-docs.yaml" \
  -o "${OUTPUT_DIR}/openapi.yaml"

echo
echo "Documentation OpenAPI générée :"
ls -lh \
  "${OUTPUT_DIR}/openapi.json" \
  "${OUTPUT_DIR}/openapi.yaml"
