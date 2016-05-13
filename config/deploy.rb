 # The project name. (one word: no spaces, dashes, or underscores)
set :application, "blt"

# List the Drupal multi-site folders.  Use "default" if no multi-sites are installed.
# set :domains, ["google.com", "somethingelse.com"]
set :domains, ["default"]
set :tables, "common"

# Set the repository type and location to deploy from.
set :scm, :git
set :repository,  "git@github.com:maskedjellybean/#{application}.git"

# Resolve issue with 'cap [STAGE] deploy:check' http://stackoverflow.com/questions/5046989/newbie-capistrano-rails-deployment-problem-cant-find-git-in-the-path
set :scm_command, "/home/megank9/bin/git"
set :local_scm_command, "git"

# E-mail address to notify of production deployments
set :notify_email, "benteegarden@gmail.com"

# Set the database passwords that we'll use for maintenance. Probably only used
# during setup.
set(:db_root_pass) { '-p' + Capistrano::CLI.password_prompt("Production Root MySQL password: ") }
set(:db_pass) { random_password }

# The subdirectory within the repo containing the DocumentRoot.
set :app_root, "drupal"

# Use a remote cache to speed things up
# set :deploy_via, :remote_cache
# ssh_options[:user] = 'deploy'
# ssh_options[:forward_agent] = true

# Multistage support - see config/deploy/[STAGE].rb for specific configs
set :default_stage, "dev"
set :stages, %w(dev staging qa prod)

before 'multistage:ensure' do
  # Set the branch to the current stage, unless it's been overridden
  if !exists?(:branch)
    set :branch, stage
  end

  # Extra reminders for production.
  if (stage == :prod)
    before "deploy", "deploy:quality"
    after "deploy", "deploy:notify"
  end

  # Tag staging and production releases
  if (stage == :staging || stage == :prod)
    after "deploy", "deploy:tag_release"
  end
end

# Generally don't need sudo for this deploy setup
set :use_sudo, false

# This allows the sudo command to work if you do need it
default_run_options[:pty] = true

default_run_options[:env] = {'PATH' => '/home/megank9/bin/git:$PATH'}

# Override these in your stage files if your web server group is something other than apache
set :httpd_group, 'apache'

# build Compass artifacts
set :theme_path, "#{app_root}/sites/all/themes"
set :theme_names, ["blt"]

after "deploy:update_code" do

  theme_names.each do|theme_name|

    require 'fileutils'
    tmp_theme = "/tmp/#{application}-#{release_name}"
    Dir.mkdir(tmp_theme)
    download("#{release_path}/#{theme_path}/#{theme_name}", tmp_theme, {:once => true, :recursive => true, :via => :scp})

    run_locally("cd #{tmp_theme}/#{theme_name} && bundle install && bundle exec compass clean")
    run_locally("cd #{tmp_theme}/#{theme_name} && bundle exec compass compile --output-style compressed")
    upload("#{tmp_theme}/#{theme_name}/css/compiled",
      "#{release_path}/#{theme_path}/#{theme_name}/css/compiled",
       {:via => :sftp, :mkdir => true})
    # Glob is nasty, but the generated_images directory
    # option isn't supported until Compass 0.12.
    Dir.glob("#{tmp_theme}/#{theme_name}/images/*-s[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].png").each do|f|
      upload(f, "#{release_path}/#{theme_path}/#{theme_name}/images/#{File.basename(f)}")
    end

    FileUtils.rmtree(tmp_theme);
  end
end

# after "deploy:cacheclear"
