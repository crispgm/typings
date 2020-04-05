#!/usr/bin/env bash

cp -r src/* docs/

sed -i 's/@import url("\/themes\//@import url("\/typings\/themes\//g' docs/assets/style.css
sed -i 's/<link href="\/assets\/style.css" rel="stylesheet">/<link href="\/typings\/assets\/style.css" rel="stylesheet">/g' docs/index.html
