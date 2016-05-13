# Set the deployment directory on the target hosts.
set :deploy_to, "public_html/benteegarden.com"

# The hostnames to deploy to.
role :web, 'benteegarden.com'

set :gateway, 'ecbiz108.inmotionhosting.com'

# Specify one of the web servers to use for database backups or updates.
# This server should also be running Drupal.
role :db, "benteegarden.com", :primary => true

# The path to drush
set :drush, "cd ~/public_html/benteegarden.com ; ~/.composer/vendor/bin/drush"

# The username on the target system, if different from your local username
ssh_options[:user] = 'megank9'

ssh_options[:port] = 2222
