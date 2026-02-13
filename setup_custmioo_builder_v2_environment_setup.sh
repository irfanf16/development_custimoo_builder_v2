#!/bin/bash

# =====================
# CONFIGURATION DEFAULTS
# =====================
working_directory=$(pwd)
parent_dir=$(basename "$(pwd)")
env_file_name=.env

build_directory_name="artifacts"
domain="custimoo-builder-v2.test"
move_to_nginx=true
protocol="http"

# =====================
# HELP MESSAGE
# =====================
function usage {
  echo "Below is the list of accepted parameters"
  echo "   -b,   --builddirectoryname   Set the build directory name (default: $build_directory_name)"
  echo "   -mtn  --movetonginx          If true then move builds to nginx path (/var/www) (default: $move_to_nginx)"
  echo "   -p,   --protocol             Set the protocol {http, https} (default: $protocol)"
  echo "   -d,   --domain               Set the domain name/virtual host (default: $domain)"
  echo "   -u,   --apiurl               Set the build api url"
  echo "   -h,   --help                 Display this help message"
  exit 1
}

# =====================
# ARGUMENT PARSING
# =====================
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -b|--builddirectoryname) build_directory_name="$2"; shift ;;
    -mtn|--movetonginx) move_to_nginx="$2"; shift ;;
    -p|--protocol) protocol="$2"; shift ;;
    -d|--domain) domain="$2"; shift ;;
    -u|--apiurl) api_url="$2"; shift ;;
    -h|--help) usage ;;
    *) echo "Invalid option: $1" >&2; usage ;;
  esac
  shift
done

# Escape API URL if present
api_url_escaped=$(echo "$api_url" | sed 's/\//\\\//g')

# =====================
# ENSURE NGINX IS INSTALLED
# =====================
if which nginx >/dev/null; then
  echo "********** Nginx is already installed: $(nginx -v 2>&1) **********"
  sudo systemctl enable nginx
  sudo systemctl start nginx
else
  echo "********** Installing Nginx **********"
  sudo apt-get update -y
  sudo apt-get install -y nginx
  sudo systemctl enable nginx
  sudo systemctl start nginx
fi

# =====================
# ENSURE DOMAIN DIRECTORY
# =====================
DOMAIN_ROOT="/var/www/$domain"
if [[ ! -d "$DOMAIN_ROOT" ]]; then
  echo "********** Creating domain directory at $DOMAIN_ROOT **********"
  sudo mkdir -p "$DOMAIN_ROOT"
fi
sudo chown -R "$USER:$USER" "$DOMAIN_ROOT"

# =====================
# NODE/NVM ENVIRONMENT
# =====================
source ~/.nvm/nvm.sh
if command -v nvm >/dev/null 2>&1; then
  echo "********** NVM installed, version: $(nvm --version) **********"
  if nvm ls 24 | grep -q "v24\."; then
    nvm use 24
  else
    nvm install 24
    nvm use 24
  fi
else
  echo "********** Installing NVM **********"
  sudo apt-get install -y curl
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
  source ~/.nvm/nvm.sh
  nvm install 24
  nvm use 24
fi

# =====================
# BUILD PROJECT
# =====================
# rm -rf node_modules package-lock.json
npm cache clean --force
# npm install @iconify-json/flex-line --save-dev
npm ci

echo "*********** npm run build ***********"
npm run build:staging

mkdir -p "$build_directory_name/development"
if [[ -d "dist" ]]; then
  rm -rf "$build_directory_name/development"/*
  cp -a dist/. "$build_directory_name/development"/
fi


# DEPLOY TO /var/www
if [ "$move_to_nginx" = "true" ]; then
  echo "********** Deploying build and project files to $DOMAIN_ROOT **********"
  sudo rm -rf "$DOMAIN_ROOT"/*

  # Copy build output first
  if [[ -d "$build_directory_name/development" ]]; then
    sudo cp -a "$build_directory_name/development"/. "$DOMAIN_ROOT/"
  else
    echo "No build directory found."
  fi

  # Copy rest of the project except node_modules, build artifacts, .git and .env
  rsync -av \
    --exclude 'node_modules' \
    --exclude "$build_directory_name" \
    --exclude '.git' \
    ./ "$DOMAIN_ROOT/"
fi

# =====================
# CREATE/VERIFY VHOST
# =====================
echo "********** CREATING/VERIFYING VIRTUAL HOST **********"
VHOST_PATH="/etc/nginx/sites-available/$domain"
ENABLED_LINK="/etc/nginx/sites-enabled/$domain"

# Clean up old .local configs if any
sudo rm -f /etc/nginx/sites-enabled/${parent_dir}.local
sudo rm -f /etc/nginx/sites-available/${parent_dir}.local

if [[ ! -f "$VHOST_PATH" ]]; then
  echo "Creating new virtual host config for $domain"
  sudo chmod +x ./setup_domain_v1.sh
  ./setup_domain_v1.sh -d "$domain" -b "$DOMAIN_ROOT" -mtn "$move_to_nginx"
else
  echo "Virtual host config already exists: $VHOST_PATH"
fi

if [[ ! -L "$ENABLED_LINK" ]]; then
  echo "Creating symlink $ENABLED_LINK -> $VHOST_PATH"
  sudo ln -s "$VHOST_PATH" "$ENABLED_LINK"
fi

echo "********** VIRTUAL HOST STEP COMPLETE **********"

# =====================
# RELOAD NGINX
# =====================
echo "********** Testing and reloading nginx **********"
sudo nginx -t && sudo systemctl reload nginx
