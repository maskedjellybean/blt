# Set the deployment directory on the target hosts.
set :deploy_to, "/var/www/sites/virtual/#{application}-#{stage}"

# The hostnames to deploy to.
role :web, "stg01-savers.ec2.metaltoad.net"

# Specify one of the web servers to use for database backups or updates.
# This server should also be running Drupal.
role :db, "stg01-savers.ec2.metaltoad.net", :primary => true

set :gateway, 'mole.metaltoad.com'

# The path to drush
set :drush, "cd #{current_path}/#{app_root} ; /usr/local/bin/drush"

# The username on the target system, if different from your local username
ssh_options[:user] = 'deploy'
