cd ~/turftown-backend

git pull origin develop
npm install
pm2 restart turftown
pm2 logs turftown
