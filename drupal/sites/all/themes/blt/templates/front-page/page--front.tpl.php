<?php
/**
 * @file
 * Custom page template for front page in order to render Angular Portfolio app.
 *
 * The doctype, html, head and body tags are not in this template. Instead they
 * can be found in the html.tpl.php template in this directory.
 *
 * Available variables:
 *
 * General utility variables:
 * - $base_path: The base URL path of the Drupal installation. At the very
 *   least, this will always default to /.
 * - $directory: The directory the template is located in, e.g. modules/system
 *   or themes/bartik.
 * - $is_front: TRUE if the current page is the front page.
 * - $logged_in: TRUE if the user is registered and signed in.
 * - $is_admin: TRUE if the user has permission to access administration pages.
 *
 * Site identity:
 * - $front_page: The URL of the front page. Use this instead of $base_path,
 *   when linking to the front page. This includes the language domain or
 *   prefix.
 * - $logo: The path to the logo image, as defined in theme configuration.
 * - $site_name: The name of the site, empty when display has been disabled
 *   in theme settings.
 * - $site_slogan: The slogan of the site, empty when display has been disabled
 *   in theme settings.
 *
 * Navigation:
 * - $main_menu (array): An array containing the Main menu links for the
 *   site, if they have been configured.
 * - $secondary_menu (array): An array containing the Secondary menu links for
 *   the site, if they have been configured.
 * - $breadcrumb: The breadcrumb trail for the current page.
 *
 * Page content (in order of occurrence in the default page.tpl.php):
 * - $title_prefix (array): An array containing additional output populated by
 *   modules, intended to be displayed in front of the main title tag that
 *   appears in the template.
 * - $title: The page title, for use in the actual HTML content.
 * - $title_suffix (array): An array containing additional output populated by
 *   modules, intended to be displayed after the main title tag that appears in
 *   the template.
 * - $messages: HTML for status and error messages. Should be displayed
 *   prominently.
 * - $tabs (array): Tabs linking to any sub-pages beneath the current page
 *   (e.g., the view and edit tabs when displaying a node).
 * - $action_links (array): Actions local to the page, such as 'Add menu' on the
 *   menu administration interface.
 * - $feed_icons: A string of all feed icons for the current page.
 * - $node: The node object, if there is an automatically-loaded node
 *   associated with the page, and the node ID is the second argument
 *   in the page's path (e.g. node/12345 and node/12345/revisions, but not
 *   comment/reply/12345).
 *
 * Regions:
 * - $page['help']: Dynamic help text, mostly for admin pages.
 * - $page['highlighted']: Items for the highlighted content region.
 * - $page['content']: The main content of the current page.
 * - $page['sidebar_first']: Items for the first sidebar.
 * - $page['sidebar_second']: Items for the second sidebar.
 * - $page['header']: Items for the header region.
 * - $page['footer']: Items for the footer region.
 *
 * @see bootstrap_preprocess_page()
 * @see template_preprocess()
 * @see template_preprocess_page()
 * @see bootstrap_process_page()
 * @see template_process()
 * @see html.tpl.php
 *
 * @ingroup templates
 */
?>

<!-- Header, logo, main menu, navbar -->

<header id="navbar" role="banner" class="navbar">
  <div class="navbar-container container-fluid">
    <div class="navbar-header clearfix">
      <?php if ($logo): ?>
        <div class="logo navbar-btn clearfix">
          <img src="<?php print $logo; ?>" alt="<?php print t('Home'); ?>" />
        </div>
      <?php endif; ?>
      <div class="header-links">
        <!-- <a class="phone" href="tel:920-342-5990" title="Call me"><img src="<?php print path_to_theme() . '/images/angular-portfolio-app/phone.png'; ?>"><span>920.342.5990</span></a> -->
        <a class="email" href="mailto:benteegarden@gmail.com" title="Email me"><img src="<?php print path_to_theme() . '/images/angular-portfolio-app/email.png'; ?>"><span>benteegarden@gmail.com</span></a>
        <a class="resume" href="docs/Teegarden-Ben_Resume.pdf" title="See my resume" target="_blank"><img src="<?php print path_to_theme() . '/images/angular-portfolio-app/resume.png'; ?>"><span>resume.pdf</span></a>
        <a class="linkedin" href="http://www.linkedin.com/pub/ben-teegarden/70/749/980" title="Visit my LinkedIn" target="_blank"><img src="<?php print path_to_theme() . '/images/angular-portfolio-app/linkedin.png'; ?>"><span>linkedin</span></a>
      </div>
    </div>
  </div>
</header>

<div class="portfolio-wrapper" ng-controller="PortfolioController as portfolio">

  <!-- Main content -->

  <div class="main-content-container container-fluid">
    <div class="loading" ng-hide="rows && window_width"></div>
    <section class="main-content" ng-class="{visible : rows}">
      <?php print render($page['content']); ?>
    </section>
  </div>

  <!-- Footer -->

  <footer class="footer" ng-class="{visible : rows}">
    <div class="footer-container container-fluid">
      <p class="footer-info">This site was built using AngularJS with a Drupal back-end.</p>
    </div>
  </footer>

</div>
