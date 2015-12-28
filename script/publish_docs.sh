#!/usr/bin/env bash

# inspired by http://benlimmer.com/2013/12/26/automatically-publish-javadoc-to-gh-pages-with-travis-ci/

if [ "$TRAVIS_REPO_SLUG" == "electronifie/graph-calc" ] && [ "$TRAVIS_NODE_VERSION" == "4.1" ] && [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_BRANCH" == "master" ]; then

  echo -e "Building docs...\n"
  npm run doc

  echo -e "Publishing docs...\n"
  cp -R ./doc $HOME/api-docs

  cd $HOME
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "travis-ci"
  git clone --quiet --branch=gh-pages https://${GH_TOKEN}@github.com/electronifie/graph-calc gh-pages > /dev/null

  cd gh-pages
  mv .git ../.git_backup
  rm -r *
  mv ../.git_backup .git
  cp -Rf $HOME/api-docs/* .
  git add -f .
  git commit -m "Updating autogen'd docs for travis build $TRAVIS_BUILD_NUMBER."
  git push -fq origin gh-pages > /dev/null

  echo -e "Published docs to gh-pages."

fi
