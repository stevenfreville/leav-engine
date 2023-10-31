# To avoid permissions issues later on, in particular during applications install
#chown -R node:node /app

yarn install

git config --global --add safe.directory /app

# Download artifact and extract it (contains dist folders)
node ./scripts/preload.js

# Install dependencies
#yarn workspaces focus core --production

mkdir -p /app/apps/core/dist/plugins

yarn run start --server
#sleep 60000
