#!/bin/bash
wwwroot="/var/www/"
sites_available="/etc/nginx/sites-available/"
sites_enabled="/etc/nginx/sites-enabled/"

PARENT_DIR="${PWD##*/}"

# Set the domain name
domain=$1
# Check if the first parameter is empty
if [ -z "$1" ]; then
    domain="custimoo-builder-v2.test"
    echo "first parameter is empty. Will set site to $domain"
fi

if [ ! -d "$wwwroot$domain" ]; then
    echo "The $domain is NOT in $wwwroot area, so it can NOT be cleaned up - exiting"
    #exit 1
else
    echo "Will now start to remove the site $domain - it will take some time..."
    sudo rm -rf $wwwroot$domain
    echo "Done - site has been removed"
fi

if [ ! -L "$sites_enabled$domain" ] && [ ! -f "$sites_enabled$domain" ]; then
    echo "The site $domain are NOT present in $sites_enabled , skipping"
else
    echo "Will now start to remove the symbolic link file from the enabled site $domain "
    sudo rm -f $sites_enabled$domain
    echo "Done - link was removed from $sites_enabled"
fi

if [ ! -f "$sites_available$domain" ]; then
    echo "The site $domain are NOT present in $sites_available , skipping"
else
    echo "Will now start to remove the symbolic link file for the available site $domain "
    sudo rm -f $sites_available$domain
    echo "Done - link was removed from $sites_available"
fi

# Test and reload nginx if installed (do not fail cleanup on config errors)
if which nginx >/dev/null 2>&1; then
    if sudo nginx -t; then
        sudo service nginx reload
    else
        echo "nginx config test failed; skipping reload"
    fi
fi
