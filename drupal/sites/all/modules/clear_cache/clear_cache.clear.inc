<?php
/**
 * To make sure we ALWAYS use Truncate to clear tables, we changed a few lines of code in the function "drupal_flush_all_caches()" from the file located in "includes/common.inc".
 * Dont panic yet, this is what modules are for, so we can change Drupal core behavior without messing things for everyone.
 * Truncate is much faster to use than db_delete() because truncate deletes ALL ROWS, leaving the structure and columns intact rather than deleting row by row.
 * In fact, the function below is similar to drupal_flush_all_caches(), with a few omissions and additions. 
 * We Don't truncate the "cache_form" table because in-progress form submissions may break.
 * Note that the table "cache_page" is the last table to be truncated.
*/
 function clear_cache_truncate() { 
  
  // Change query-strings on css/js files to enforce reload for all users.
  _drupal_flush_css_js();

  registry_rebuild();
  drupal_clear_css_cache();
  drupal_clear_js_cache();

  // Rebuild the theme data. Note that the module data is rebuilt above, as
  // part of registry_rebuild().
  system_rebuild_theme_data();
  drupal_theme_rebuild();

  entity_info_cache_clear();
  node_types_rebuild();
  // node_menu() defines menu items based on node types so it needs to come
  // after node types are rebuilt.
  menu_rebuild();

  // Synchronize to catch any actions that were added or removed.
  actions_synchronize();
  
  // Ordered so clearing the page cache will always be the last action.
  // Note that the list includes views tables. The views moduile is not required. First test to see if views module is installed  
  $cached_tables = array('cache', 'cache_block', 'cache_bootstrap', 'cache_field', 'cache_filter', 'cache_image', 'cache_menu', 'cache_path');
  
  // check to see if cache_views table exists, if so, add cache_views table to the list to be truncated
  if (db_table_exists('cache_views')) {
    $cached_tables[] = 'cache_views';
  }
  // check to see if cache_views_data table exists, if so, add cache_views_data table to the list to be truncated
  if (db_table_exists('cache_views_data')) {
    $cached_tables[] = 'cache_views_data';
  }
  // add the cache_page to the array list
  $cached_tables[] = 'cache_page';
  
  // use truncate() instead of delete to clear tables
  foreach ($cached_tables as $cached_table) {  
   db_truncate($cached_table)->execute();   
  }
  
  // Rebuild the bootstrap module list. We do this here so that developers
  // can get new hook_boot() implementations registered without having to
  // write a hook_update_N() function.
  _system_update_bootstrap_status();
  
  drupal_set_message(t('Success &#x270c; <br/>All Drupal Caches cleared.'), 'status');
  
  // added a redirect to referer or current page to come back to
   if (isset($_SERVER['HTTP_REFERER'])) {
   $referer_path = $_SERVER['HTTP_REFERER'];  
   drupal_goto($referer_path);
   }
   else { // fallback
    drupal_goto('<front>');
   }
}
