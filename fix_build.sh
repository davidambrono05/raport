
npm run build
if [ -d "dist/client" ]; then
  cp -r dist/client/* dist/
  echo "Fisiere mutate din dist/client in dist/"
fi
