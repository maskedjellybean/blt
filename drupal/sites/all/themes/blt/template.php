<?php
/**
 * @file
 * The primary PHP file for this theme.
 */

/**
 * Implements theme_preprocess_page().
 * Adds CSS for AngularJS app on front page.
 */
function blt_preprocess_page(&$variables) {
  if (drupal_is_front_page()) {
    drupal_add_css(drupal_get_path('theme', 'blt') . "/angular-portfolio-app/css/libraries/flexslider/flexslider.css");
    drupal_add_css(drupal_get_path('theme', 'blt') . "/angular-portfolio-app/css/portfolio.css");
    drupal_add_css(drupal_get_path('theme', 'blt') . "/angular-portfolio-app/css/portfolio--blt.css");
  }
}

/**
 * Implements theme_preprocess_node().
 * Creates node template suggestion for front page.
 */
function blt_preprocess_node(&$variables) {
  if (drupal_is_front_page()) {
    $variables['theme_hook_suggestions'][] = 'node__front';
  }
}

/**
 * Implements theme_js_alter().
 * Removes unnecessary JS from AngularJS app front page.
 */
function blt_js_alter(&$javascript) {
  if (drupal_is_front_page()) {
    $bootstrap_path = drupal_get_path('theme', 'bootstrap');
    unset($javascript[$bootstrap_path . '/js/bootstrap.js']);
    $bootstrap_library_path = drupal_get_path('theme', 'blt') . '/js/libraries/bootstrap/';
    unset($javascript[$bootstrap_library_path . 'affix.js']);
    unset($javascript[$bootstrap_library_path . 'alert.js']);
    unset($javascript[$bootstrap_library_path . 'button.js']);
    unset($javascript[$bootstrap_library_path . 'carousel.js']);
    unset($javascript[$bootstrap_library_path . 'collapse.js']);
    unset($javascript[$bootstrap_library_path . 'dropdown.js']);
    unset($javascript[$bootstrap_library_path . 'modal.js']);
    unset($javascript[$bootstrap_library_path . 'tooltip.js']);
    unset($javascript[$bootstrap_library_path . 'popover.js']);
    unset($javascript[$bootstrap_library_path . 'scrollspy.js']);
    unset($javascript[$bootstrap_library_path . 'tab.js']);
    unset($javascript[$bootstrap_library_path . 'transition.js']);
    unset($javascript[drupal_get_path('module', 'caption_filter') . '/js/caption-filter.js']);
  }
}

