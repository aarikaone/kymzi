#!/bin/zsh
cd "${0:A:h}"
print '\nRymzi — New cities. New pals.\nOpen http://127.0.0.1:4178 after the server starts.\nPress Ctrl+C to stop.\n'
if [[ ! -d node_modules ]]; then
  npm ci || exit 1
fi
npm run dev
