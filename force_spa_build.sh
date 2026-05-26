
npm run build
if [ -d "dist/client" ]; then
  cp -r dist/client/* dist/
fi
