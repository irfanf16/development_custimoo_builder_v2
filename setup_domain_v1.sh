#!/bin/bash

# Defaults
domain=""
build_directory_name=""
move_to_nginx=true

function usage {
  echo "Below is the list of accepted parameters"
  echo "   -b,    --builddirectoryname   Set the build directory name"
  echo "   -mtn   --movetonginx          If true then use /var/www/<domain> as docroot (default: $move_to_nginx)"
  echo "   -d,    --domain               Set domain"
  echo "   -h,    --help                 Display this help message"
  exit 1
}

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -b|--builddirectoryname) build_directory_name="$2"; shift ;;
    -mtn|--movetonginx) move_to_nginx="$2"; shift ;;
    -d|--domain) domain="$2"; shift ;;
    -h|--help) usage ;;
    *) echo "Invalid option: $1" >&2; usage ;;
  esac
  shift
done

if [[ -z "$domain" ]]; then
  echo "Error: domain not specified"
  usage
fi

# Determine docroot
if [ "$move_to_nginx" = "true" ]; then
  docroot="/var/www/$domain"
else
  docroot="$build_directory_name"
fi

# Create Nginx vhost config
config="/etc/nginx/sites-available/$domain"
sudo tee "$config" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;

    root $docroot;
    index index.html index.htm;

    server_name $domain www.$domain;

    location / {
        try_files \$uri \$uri/ /index.html?\$query_string;
        add_header Access-Control-Allow-Origin *;
    }

    error_page 404 /;
}
EOF

# Ensure symlink
link_path="/etc/nginx/sites-enabled/$domain"
if [ ! -L "$link_path" ]; then
  sudo ln -s "$config" "$link_path"
  echo "Symbolic link created at $link_path"
fi

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Fix ownership
sudo chown -R $USER:$USER "$docroot"