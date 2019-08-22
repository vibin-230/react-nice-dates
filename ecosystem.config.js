module.exports = {
    apps : [
        {
          name: "turftown",
          script: "./index.js",
          watch: true,
          env: {
              "PORT": 3040,
              "NODE_ENV": "development",
              "DB_CONN" : "mongodb://akshay:qwerty@13.233.5.103/turftown",
              "PHP_SERVER": "http://159.65.146.12/app/turftown-backend",
              "AWS_SECRET_KEY": "9SkVgIrzjl+PoiOZ5AVMDSHxkQzuS+qt4gYG8BS+",
              "AWS_ACCESS_KEY": "AKIAJCWCKO7WP7A6PPYQ",
              "AWS_REGION": "ap-south-1"
          },
          env_stage: {
              "PORT": 3040,
              "NODE_ENV": "production",
              "DB_CONN" : "mongodb://akshay:qwerty@13.233.5.103/turftown",
              "PHP_SERVER": "http://159.65.146.12/app/turftown-backend",
              "AWS_SECRET_KEY": "9SkVgIrzjl+PoiOZ5AVMDSHxkQzuS+qt4gYG8BS+",
              "AWS_ACCESS_KEY": "AKIAJCWCKO7WP7A6PPYQ",
              "AWS_REGION": "ap-south-1"
          },
          env_production: {
              "PORT": 3040,
              "NODE_ENV": "stage",
              "DB_CONN" : "mongodb://akshay:qwerty@13.233.94.159/turftown",
              "PHP_SERVER": "http://159.65.146.12/app/turftown-backend",
              "AWS_SECRET_KEY": "9SkVgIrzjl+PoiOZ5AVMDSHxkQzuS+qt4gYG8BS+",
              "AWS_ACCESS_KEY": "AKIAJCWCKO7WP7A6PPYQ",
              "AWS_REGION": "ap-south-1"
          }
        }
    ]
  }