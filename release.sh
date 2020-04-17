npm run build
npm version patch

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

VERSION="v${PACKAGE_VERSION}"

git add .
git commit -m "${VERSION}"
git checkout master
git merge develop
git tag "${VERSION}"
git push
git push --tags
git checkout develop
git push
