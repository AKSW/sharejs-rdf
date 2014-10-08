#!/bin/bash

function init-dir {
  BRANCH="$1"
  
  if [ -d "$BRANCH" ]
  then
    echo "$BRANCH exists"
  else
    git clone "git@github.com:AKSW/sharejs-rdf.git" -b "$BRANCH" "$BRANCH"
  fi

  if [ "$NPM_INSTALL" = true ]
  then
    cd "$BRANCH"
    npm install
    cd ..
  fi
}

function help {
  echo "Usage: ./init.sh [options...]"
  echo "  Initializes the main directory and puts the branches in it."
  echo ""
  echo "Options:"
  echo "  --help              Print this help"
  echo "  --npm               Runs 'npm install' in each branch directory"
  echo ""
}


NPM_INSTALL=false

while test $# -gt 0
do
  case "$1" in
    --help) help; exit 0
      ;;
    --npm) NPM_INSTALL=true
      ;;
    *) echo "Bad option: $1"; exit 1
  esac
  shift
done

init-dir "sharejs-rdf-ext"
init-dir "server"
init-dir "angular-directives"
init-dir "sample-app"

