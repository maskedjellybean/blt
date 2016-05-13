# :branch, :build, and :node must be passed in with -s

set :deploy_to, "/var/www/sites/virtual/#{application}-#{branch}-#{build}.#{run_locally('hostname').strip()}"

role :web, fetch(:node)
role :db, fetch(:node), :primary => true

# The path to drush
set :drush, "cd #{current_path}/#{app_root} ; /usr/local/bin/drush --nocolor"

# The username on the target system, if different from your local username
ssh_options[:user] = 'deploy'

# Override this, so the database name includes the build ID
def short_name(domain=nil)
  return "#{application[0..23]}_#{stage.to_s[0..9]}_#{domain[0..20]}_#{build.to_s[0..5]}".gsub('.', '_')
end

# Create a random username, just not enough space for a semantic name
set :tiny, random_password(16)
def tiny_name(domain=nil)
  return fetch(:tiny)
end

# Password is managed in /home/deploy/.my.cnf
set :db_root_pass, ''
