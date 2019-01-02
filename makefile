deploy: ~/projects/fot/vue3/ui/node_modules/pixi-viewport/dist/*.js

~/projects/fot/vue3/ui/node_modules/pixi-viewport/dist/%.js: dist/%.js
	rsync2 dist/ ~/projects/fot/vue3/ui/node_modules/pixi-viewport/dist --delete-after

dist/%.js: src/%.js
	toast transpiling
	yarn transpile
#echo at $@
#echo star $*
#echo less $<

watch-drag:
	while wait_for_filechange src/drag.js ; do make deploy ;toast refreshed viewport; done

watch-bounce:
	while wait_for_filechange src/bounce.js ; do make deploy ;toast refreshed viewport; done

watch:
	while wait_for_filechange src/wheel.js ; do make deploy ;toast refreshed viewport; done
