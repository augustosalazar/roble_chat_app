#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

TRAEFIK_PORT="${DEV_TRAEFIK_PORT:-8080}"
PG_PORT="${DEV_PG_PORT:-15432}"
PG_USER="roble"
PG_PASSWORD="roble1"
NETWORK="roble-dev-network"

SUFFIX="dev_$(date +%s)"

CONTAINER_NAMES=(
  "dev-traefik-${SUFFIX}"
  "dev-postgres-${SUFFIX}"
  "dev-app-roble-${SUFFIX}"
  "dev-auth-service-roble-${SUFFIX}"
  "dev-db-service-roble-${SUFFIX}"
  "dev-front-roble-${SUFFIX}"
  "dev-roble-realtime-${SUFFIX}"
)

cleanup() {
  local ec=$?
  echo ""
  echo "=== Cleaning up ==="
  for name in "${CONTAINER_NAMES[@]}"; do
    docker stop "$name" 2>/dev/null || true
    docker rm "$name" 2>/dev/null || true
  done
  exit $ec
}
trap cleanup EXIT

echo ""
echo "=== Creating Docker network ==="
docker network create "${NETWORK}" 2>/dev/null || true

echo ""
echo "=== Starting PostgreSQL ==="
docker run -d --name "dev-postgres-${SUFFIX}" \
  --network "${NETWORK}" \
  -p "${PG_PORT}:5432" \
  -e POSTGRES_USER="${PG_USER}" \
  -e POSTGRES_PASSWORD="${PG_PASSWORD}" \
  -e POSTGRES_DB="roble" \
  postgres:16-alpine

echo "  Waiting for PostgreSQL on port ${PG_PORT}..."
for i in $(seq 1 30); do
  if docker exec "dev-postgres-${SUFFIX}" pg_isready -U "${PG_USER}" >/dev/null 2>&1; then
    echo "  PostgreSQL ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  ERROR: PostgreSQL not ready"
    exit 1
  fi
  sleep 1
done

PSQL="docker exec -i dev-postgres-${SUFFIX} psql -U ${PG_USER}"
echo "  Creating databases..."
echo "CREATE DATABASE \"apps_roble_db\";" | ${PSQL}
echo "CREATE DATABASE \"users_roble_db\";" | ${PSQL}

echo ""
echo "=== Building roble-realtime (npm ci + tsc) ==="
pushd "$SCRIPT_DIR/roble-realtime" > /dev/null
npm ci 2>&1 | tail -1
npx tsc 2>&1 | tail -3
popd > /dev/null

echo "=== Building Docker images ==="
echo "  Building app-roble..."
docker build -t dev-app-roble -q "$SCRIPT_DIR/app-roble"
echo "  Building auth-service-roble..."
docker build -t dev-auth-service -q "$SCRIPT_DIR/auth-service-roble"
echo "  Building db-service-roble..."
docker build -t dev-db-service -q "$SCRIPT_DIR/db-service-roble"
echo "  Building roble-realtime..."
docker build -t dev-roble-realtime -q "$SCRIPT_DIR/roble-realtime"

echo "  Building front-roble..."
pushd "$SCRIPT_DIR/front-roble" > /dev/null
cat > .env.production << EOF
VITE_API_BASE=http://localhost:${TRAEFIK_PORT}
EOF
docker build -t dev-front-roble -q .
rm -f .env.production
popd > /dev/null

echo ""
echo "=== Starting Traefik ==="
docker run -d \
  --name "dev-traefik-${SUFFIX}" \
  --network "${NETWORK}" \
  -p "${TRAEFIK_PORT}:80" \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  traefik:v3.0 \
  --providers.docker=true \
  --providers.docker.exposedbydefault=false \
  --entrypoints.web.address=:80
echo "  Traefik started on port ${TRAEFIK_PORT}"
sleep 3

wait_for_backend() {
  local label=$1 cname=$2 url=$3 retries=${4:-60} i=0
  echo "  Waiting for $label..."
  while [ $i -lt $retries ]; do
    if ! docker inspect "$cname" >/dev/null 2>&1; then
      echo "  Container $cname not found"
      return 1
    fi
    if [ "$(docker inspect "$cname" --format='{{.State.Status}}')" != "running" ]; then
      i=$((i + 1))
      sleep 2
      continue
    fi
    local body
    body=$(curl -s --connect-timeout 5 "$url" 2>/dev/null) || true
    if echo "$body" | grep -q '^{'; then
      echo "  $label ready"
      return 0
    fi
    i=$((i + 1))
    [ $((i % 10)) -eq 0 ] && echo "  $label ... attempt $i/$retries"
    sleep 2
  done
  echo "  ERROR: $label not ready after $retries attempts"
  docker logs --tail=30 "$cname" 2>/dev/null || true
  return 1
}

PG_CONTAINER="dev-postgres-${SUFFIX}"
PG_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_CONTAINER}:5432"

echo ""
echo "=== Starting app-roble ==="
docker run -d \
  --name "dev-app-roble-${SUFFIX}" \
  --network "${NETWORK}" \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.dev-backend-${SUFFIX}.rule=PathPrefix(\`/api\`)" \
  --label "traefik.http.routers.dev-backend-${SUFFIX}.priority=100" \
  --label "traefik.http.routers.dev-backend-${SUFFIX}.entrypoints=web" \
  --label "traefik.http.routers.dev-backend-${SUFFIX}.middlewares=strip-api-prefix-${SUFFIX}@docker" \
  --label "traefik.http.middlewares.strip-api-prefix-${SUFFIX}.stripprefix.prefixes=/api" \
  --label "traefik.http.services.dev-backend-${SUFFIX}.loadbalancer.server.port=3000" \
  -e PORT=3000 \
  -e DB_HOST="${PG_CONTAINER}" \
  -e DB_PORT="5432" \
  -e DB_USER="${PG_USER}" \
  -e DB_PASSWORD="${PG_PASSWORD}" \
  -e DB_DATABASE="apps_roble_db" \
  -e DATABASE_URL="${PG_URL}/apps_roble_db" \
  -e TENANT_DATABASE_URL="${PG_URL}/users_roble_db" \
  -e APP_PRINCIPAL="users_roble_db" \
  -e JWT_SECRET="RobLe_JwtSecret" \
  -e DB_SERVICE_URL="http://dev-db-service-roble-${SUFFIX}:3000" \
  -e AUTH_SERVICE_URL="http://dev-auth-service-roble-${SUFFIX}:3000" \
  -e SERVICE_NAME="backend-service" \
  dev-app-roble

echo "  Waiting for app-roble (migrations + seed)..."
wait_for_backend "app-roble" "dev-app-roble-${SUFFIX}" "http://localhost:${TRAEFIK_PORT}/api/" 120
echo "  app-roble ready"

echo ""
echo "=== Starting auth-service-roble ==="
docker run -d \
  --name "dev-auth-service-roble-${SUFFIX}" \
  --network "${NETWORK}" \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.dev-auth-${SUFFIX}.rule=PathPrefix(\`/auth\`)" \
  --label "traefik.http.routers.dev-auth-${SUFFIX}.priority=200" \
  --label "traefik.http.routers.dev-auth-${SUFFIX}.entrypoints=web" \
  --label "traefik.http.routers.dev-auth-${SUFFIX}.middlewares=strip-auth-prefix-${SUFFIX}@docker" \
  --label "traefik.http.middlewares.strip-auth-prefix-${SUFFIX}.stripprefix.prefixes=/auth" \
  --label "traefik.http.services.dev-auth-${SUFFIX}.loadbalancer.server.port=3000" \
  -e PORT=3000 \
  -e DB_HOST="${PG_CONTAINER}" \
  -e DB_PORT="5432" \
  -e DB_USER="${PG_USER}" \
  -e DB_PASSWORD="${PG_PASSWORD}" \
  -e DB_DATABASE="apps_roble_db" \
  -e DATABASE_URL="${PG_URL}/apps_roble_db" \
  -e TENANT_DATABASE_URL="${PG_URL}/users_roble_db" \
  -e APP_PRINCIPAL="users_roble_db" \
  -e JWT_SECRET="RobLe_JwtSecret" \
  -e FRONTEND_URL="http://localhost:${TRAEFIK_PORT}" \
  -e SERVICE_NAME="auth-service" \
  dev-auth-service

echo ""
echo "=== Starting db-service-roble ==="
docker run -d \
  --name "dev-db-service-roble-${SUFFIX}" \
  --network "${NETWORK}" \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.dev-database-${SUFFIX}.rule=PathPrefix(\`/database\`)" \
  --label "traefik.http.routers.dev-database-${SUFFIX}.priority=150" \
  --label "traefik.http.routers.dev-database-${SUFFIX}.entrypoints=web" \
  --label "traefik.http.routers.dev-database-${SUFFIX}.middlewares=strip-database-prefix-${SUFFIX}@docker" \
  --label "traefik.http.middlewares.strip-database-prefix-${SUFFIX}.stripprefix.prefixes=/database" \
  --label "traefik.http.services.dev-database-${SUFFIX}.loadbalancer.server.port=3000" \
  -v "$SCRIPT_DIR/shared:/shared:ro" \
  -e PORT=3000 \
  -e DB_HOST="${PG_CONTAINER}" \
  -e DB_PORT="5432" \
  -e DB_USER="${PG_USER}" \
  -e DB_PASSWORD="${PG_PASSWORD}" \
  -e DB_DATABASE="apps_roble_db" \
  -e DATABASE_URL="${PG_URL}/apps_roble_db" \
  -e TENANT_DATABASE_URL="${PG_URL}/users_roble_db" \
  -e APP_PRINCIPAL="users_roble_db" \
  -e JWT_SECRET="RobLe_JwtSecret" \
  -e AUTH_SERVICE_URL="http://dev-auth-service-roble-${SUFFIX}:3000" \
  -e APP_SERVICE_URL="http://dev-app-roble-${SUFFIX}:3000" \
  -e SERVICE_NAME="database-service" \
  -e PROTO_PATH="/shared/backup.proto" \
  -e BACKUP_ENCRYPTION_SECRET="RobleTestSecret2024" \
  dev-db-service

echo ""
echo "=== Starting roble-realtime ==="
docker run -d \
  --name "dev-roble-realtime-${SUFFIX}" \
  --network "${NETWORK}" \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.dev-realtime-${SUFFIX}.rule=PathPrefix(\`/realtime\`)" \
  --label "traefik.http.routers.dev-realtime-${SUFFIX}.priority=180" \
  --label "traefik.http.routers.dev-realtime-${SUFFIX}.entrypoints=web" \
  --label "traefik.http.routers.dev-realtime-${SUFFIX}.middlewares=strip-realtime-prefix-${SUFFIX}@docker" \
  --label "traefik.http.middlewares.strip-realtime-prefix-${SUFFIX}.stripprefix.prefixes=/realtime" \
  --label "traefik.http.services.dev-realtime-${SUFFIX}.loadbalancer.server.port=3000" \
  -e PORT=3000 \
  -e DB_HOST="${PG_CONTAINER}" \
  -e DB_PORT="5432" \
  -e DB_USER="${PG_USER}" \
  -e DB_PASSWORD="${PG_PASSWORD}" \
  -e DB_DATABASE="apps_roble_db" \
  -e JWT_SECRET="RobLe_JwtSecret" \
  -e SERVICE_NAME="realtime-service" \
  dev-roble-realtime

echo ""
echo "=== Starting front-roble ==="
docker run -d \
  --name "dev-front-roble-${SUFFIX}" \
  --network "${NETWORK}" \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.dev-front-${SUFFIX}.rule=PathPrefix(\`/\`)" \
  --label "traefik.http.routers.dev-front-${SUFFIX}.entrypoints=web" \
  --label "traefik.http.services.dev-front-${SUFFIX}.loadbalancer.server.port=80" \
  --label "traefik.http.routers.dev-front-${SUFFIX}.priority=1" \
  dev-front-roble

echo ""
echo "=== Waiting for all services ==="
wait_for_backend "auth-service-roble" "dev-auth-service-roble-${SUFFIX}" "http://localhost:${TRAEFIK_PORT}/auth/" 60
wait_for_backend "db-service-roble" "dev-db-service-roble-${SUFFIX}" "http://localhost:${TRAEFIK_PORT}/database/" 60
wait_for_backend "roble-realtime" "dev-roble-realtime-${SUFFIX}" "http://localhost:${TRAEFIK_PORT}/realtime/health" 60

echo ""
echo "=== All services running! ==="
echo "  Frontend:  http://localhost:${TRAEFIK_PORT}/"
echo "  API:       http://localhost:${TRAEFIK_PORT}/api/"
echo "  Auth API:  http://localhost:${TRAEFIK_PORT}/auth/"
echo "  Database:  http://localhost:${TRAEFIK_PORT}/database/"
echo "  Realtime:  http://localhost:${TRAEFIK_PORT}/realtime/"
echo ""
echo "Press Ctrl+C to stop all containers"
while true; do sleep 86400; done
