WORKING_DIR='/home/abdiel/Code/zed-clothing'
REMOTE_SERVER='root@176.57.189.216'
PACKAGE_NAME=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13; echo)
PROJECT_NAME='zed-clothing'

cd $WORKING_DIR

# Build
npm run build

# Package
zip -r $PACKAGE_NAME.zip build .env.production package.json public package-lock.json prisma

# Transfer
sftp $REMOTE_SERVER <<EOF
cd $PROJECT_NAME
put $PACKAGE_NAME.zip
exit
EOF

# Deploy
ssh $REMOTE_SERVER <<EOF
cd $PROJECT_NAME
mv uploads ..
mv $PACKAGE_NAME.zip ..
rm -rf *
mv -t . ../$PACKAGE_NAME.zip ../uploads
unzip $PACKAGE_NAME.zip
rm $PACKAGE_NAME.zip
mv .env.production .env
npm install --omit=dev
npx prisma migrate deploy
npx prisma generate
pm2 restart zed-clothing
exit
EOF

# Cleanup
cd $WORKING_DIR
rm -rf $PACKAGE_NAME.zip 

echo "Deployed Seller Dashboard to $REMOTE_SERVER"
