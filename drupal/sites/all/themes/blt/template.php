<?php
/**
 * @file
 * The primary PHP file for this theme.
 */

/* Add CSS for portfolio on home page */
function blt_preprocess_page(&$variables) {
  if (drupal_is_front_page()) {
    drupal_add_css(drupal_get_path('theme', 'blt') . "/css/libraries/flexslider/flexslider.css");  	
    drupal_add_css(drupal_get_path('theme', 'blt') . "/css/angular-portfolio-app/portfolio.css");
    drupal_add_css(drupal_get_path('theme', 'blt') . "/css/angular-portfolio-app/portfolio-blt.css");
  }
}

function blt_preprocess_node(&$variables) {
  if ($variables['is_front']) {
    $variables['theme_hook_suggestions'][] = 'node__front';
  }
}