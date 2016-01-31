/**
 * @file
 * Custom scripts for theme.
 */
(function($) {

  // Bootstrap media query breakpoints
  var bp_sm = 768,
      bp_md = 992;
      bp_lg = 1200;

  // Global window width variable
  var window_w = $(window).width(),
      bp_status = breakpoint_status(window_w);

  $(window).resize(function() {
    window_w = $(window).width();
    bp_status_prev = bp_status;
    bp_status = breakpoint_status(window_w);
  });

  function breakpoint_status(window_w) {
    if (window_w < bp_sm) {
      return 'xs';
    }
    else if ((window_w >= bp_sm) && (window_w < bp_md)) {
      return 'sm';
    }
    else if ((window_w >= bp_md) && (window_w < bp_lg)) {
      return 'md';
    }
    else if (window_w >= bp_lg) {
      return 'lg';
    }
  }

  /**
   * For .teaser-grid class, if views template has not been added to wrap
   * .views-row in Bootstrap .row, add separator divs between.
   * Move separators if window breakpoint changes.
   */
  Drupal.behaviors.teaser_grid = {
    attach: function(context) {

      row_separator();

      $(window).resize(function() {
        if (bp_status !== bp_status_prev) {
          row_separator();
        }
      });

      function row_separator() {
        $('.teaser-grid--no-row').each(function() {
          var separator_markup = '<div class="row-separator"></div>';

          // Check window width, col classes and add separators based on classes.
          row_bp_checker_result = row_bp_checker($(this), bp_status, separator_markup);

          // If breakpoint is large and there are no col-lg-* classes, use col-md-* instead.
          if (bp_status === 'lg' && !row_bp_checker_result) {
            row_bp_checker($(this), 'md', separator_markup);
          }
        });
      }

      function row_bp_checker(this_context, bp, separator_markup) {
        var col_class_found = false;
        this_context.find('.row-separator').remove();
        this_context.find('.views-row').each(function($index) {
          $index++;
          // Get all classes on element, then check for col class.
          classes_array = $(this).attr('class').split(/\s+/);
          for (var i = 0; i < classes_array.length; i++) {
            // Divide columns into 2
            if (classes_array[i] === 'col-' + bp + '-6') {
              row_divider(2, $(this), $index, separator_markup);
              col_class_found = true;
              break;
            }
            // Divide columns into 3
            else if (classes_array[i] === 'col-' + bp + '-4') {
              row_divider(3, $(this), $index, separator_markup);
              col_class_found = true;
              break;
            }
          }
        });

        return col_class_found;
      }

      function row_divider(divide_num, this_context, index, separator_markup) {
        if (index % divide_num === 0) {
          this_context.after(separator_markup);
        }
      }
    }
  };
})(jQuery);