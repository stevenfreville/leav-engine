# To avoid permissions issues later on, in particular during applications install
#chown -R node:node /app

git config --global --add safe.directory /app

echo "Get the commit SHA"
commit_sha="$(git rev-parse HEAD)"

# Get artifact ID
echo "Commit SHA: $commit_sha"
artifact_url="https://api.github.com/repos/stevenfreville/leav-engine/actions/artifacts/dist-artifact-${commit_sha}/zip"

echo "Artifact URL: $artifact_url"
curl -s -H "Authorization: Bearer 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" -LJO "$artifact_url"

echo "Unzip artifact"
unzip -q dist-artifact-${commit_sha}.zip -d dist

ls dist

echo "Clean up"
rm "dist-artifact-${commit_sha}".tar.gz

# Install dependencies
yarn workspaces focus core --production

#mkdir -p /app/apps/core/dist/plugins

yarn run start --server
sleep 60000
