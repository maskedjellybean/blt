<?php
/**
 * @file
 * portfolio.entityqueue_default.inc
 */

/**
 * Implements hook_entityqueue_default_queues().
 */
function portfolio_entityqueue_default_queues() {
  $export = array();

  $queue = new EntityQueue();
  $queue->disabled = FALSE; /* Edit this to true to make a default queue disabled initially */
  $queue->api_version = 1;
  $queue->name = 'portfolio_ben';
  $queue->label = 'Portfolio - Ben';
  $queue->language = 'en';
  $queue->handler = 'simple';
  $queue->target_type = 'node';
  $queue->settings = array(
    'target_bundles' => array(
      'portfolio_piece' => 'portfolio_piece',
    ),
    'min_size' => '0',
    'max_size' => '0',
    'act_as_queue' => 0,
  );
  $export['portfolio_ben'] = $queue;

  $queue = new EntityQueue();
  $queue->disabled = FALSE; /* Edit this to true to make a default queue disabled initially */
  $queue->api_version = 1;
  $queue->name = 'portfolio_megan';
  $queue->label = 'Portfolio - Megan';
  $queue->language = 'en';
  $queue->handler = 'simple';
  $queue->target_type = 'node';
  $queue->settings = array(
    'target_bundles' => array(
      'portfolio_piece' => 'portfolio_piece',
    ),
    'min_size' => '0',
    'max_size' => '0',
    'act_as_queue' => 0,
  );
  $export['portfolio_megan'] = $queue;

  return $export;
}
