echo "----- PREBUILD VITE APPS STARTED -----"

BASEDIR='/app'
CORE_DIR="$BASEDIR/apps/core"
LIB_UTILS_DIR="$BASEDIR/libs/utils"
LIB_UI_DIR="$BASEDIR/libs/ui"
PORTAL_DIR="$BASEDIR/apps/portal"
CORE_PORTAL_DIST="$BASEDIR/apps/core/applications/portal"
ADMIN_DIR="$BASEDIR/apps/admin"
CORE_ADMIN_DIST="$BASEDIR/apps/core/applications/admin"
DATA_STUDIO_DIR="$BASEDIR/apps/data-studio"
CORE_DATA_STUDIO_DIST="$BASEDIR/apps/core/applications/data-studio"
LOGIN_DIR="$BASEDIR/apps/login"
CORE_LOGIN_DIST="$BASEDIR/apps/core/applications/login"

echo '### BUILD CORE ###'
cd $CORE_DIR && yarn install && yarn tsc --project tsconfig.build.json

echo '### BUILD REQUIRED WORKSPACE FOR VITE APPS ###'
cd $LIB_UTILS_DIR  && yarn workspace @leav/utils build
cd $LIB_UI_DIR && yarn workspace @leav/ui build

echo '### BUILD VITE APPS ###'

# Install & build
cd $PORTAL_DIR && yarn install && yarn build
rm -rf $CORE_PORTAL_DIST && mkdir -p $CORE_PORTAL_DIST
cp -r $PORTAL_DIR/dist/* $CORE_PORTAL_DIST

# Repeat for admin app
cd $ADMIN_DIR && yarn install && yarn build
rm -rf $CORE_ADMIN_DIST && mkdir -p $CORE_ADMIN_DIST
cp -r $ADMIN_DIR/dist/* $CORE_ADMIN_DIST

# Repeat for data-studio app
cd $DATA_STUDIO_DIR && yarn install && yarn build
rm -rf $CORE_DATA_STUDIO_DIST && mkdir -p $CORE_DATA_STUDIO_DIST
cp -r $DATA_STUDIO_DIR/dist/* $CORE_DATA_STUDIO_DIST

# Repeat for login app
cd $LOGIN_DIR && yarn install && yarn build
rm -rf $CORE_LOGIN_DIST && mkdir -p $CORE_LOGIN_DIST
cp -r $LOGIN_DIR/dist/* $CORE_LOGIN_DIST

echo '### GIT PROCESS ###'

# Read version in package.json
VERSION=$(cat $BASEDIR/package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')

# Add /app/apps/core/applications and dist folders then commit
cd $CORE_DIR && git add ./dist -f && git add ./applications -f && git commit -m "Update VITE apps dist folders for version: $VERSION"

git push origin

#sleep 600

echo "----- PREBUILD VITE APPS FINISHED -----"
