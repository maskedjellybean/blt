<?php
/**
 * @file
 * portfolio.features.inc
 */

/**
 * Implements hook_entityqueue_api().
 */
function portfolio_entityqueue_api($module = NULL, $api = NULL) {
  if ($module == "entityqueue" && $api == "entityqueue_default") {
    return array("version" => "1");
  }
}

/**
 * Implements hook_ctools_plugin_api().
 */
function portfolio_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}

/**
 * Implements hook_views_api().
 */
function portfolio_views_api($module = NULL, $api = NULL) {
  return array("api" => "3.0");
}

/**
 * Implements hook_node_info().
 */
function portfolio_node_info() {
  $items = array(
    'portfolio_piece' => array(
      'name' => t('Portfolio Piece'),
      'base' => 'node_content',
      'description' => t('Create a new Portfolio Piece.'),
      'has_title' => '1',
      'title_label' => t('Admin Title (not visible)'),
      'help' => '',
    ),
  );
  drupal_alter('node_info', $items);
  return $items;
}
