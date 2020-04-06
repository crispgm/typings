#!/usr/bin/env bash

cp -r src/* docs/

sed -i 's/@import url("\/themes\//@import url("\/typings\/themes\//g' docs/assets/style.css
sed -i 's/@import url("\/themes\//@import url("\/typings\/themes\//g' docs/themes/themes.css
sed -i 's/src="\/app.js"/src="\/typings\/app.js"/g' docs/index.html
sed -i 's/<link href="\/assets\/style.css" rel="stylesheet">/<link href="\/typings\/assets\/style.css" rel="stylesheet">/g' docs/index.html
sed -i 's/"\/texts\/fixtures.json"/"\/typings\/texts\/fixtures.json"/' docs/app.js

git add docs
git commit -m "Published at `date +%s`"
git push
