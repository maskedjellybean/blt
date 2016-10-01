(function() {

  // Global config settings @todo How should this actually be done in Angular?
  config = {
    // Set number of pieces per row. Choose between 3 and 2.
    pieces_per_row: 2,
    target: 'http://benteegarden.com/api/portfolio/mk/mk.jsonp?callback=JSON_CALLBACK',
    theme_images_path: 'sites/all/themes/blt/images/angular-portfolio-app/',
    // Transition time for flipping animation. Needs to match .flip-card transition property in CSS.
    transition_time: 400,
  };

  // Configure more global config values
  config.pieces_per_row_zero = config.pieces_per_row - 1;
  if (config.pieces_per_row === 2) {
    config.ppr_key = 'ppr_2';
  }
  else {
    config.ppr_key = 'ppr_3';
  }

  // Controllers

  /**
   * Parent Controller.
   * Set on <body> and contains all other controllers.
   */
  angular.module('portfolio', ['angular-flexslider'])
  .controller('PortfolioController', ['$scope', '$timeout', '$window', 'rowsFactory', function ($scope, $timeout, $window, rowsFactory) {
    $scope.overflow_hidden = false;

    // Call factory, returns obj of pieces divided into rows
    if (!$scope.rows) {
      rowsFactory.getRows()
      .then(function(rows) {
        $scope.rows = rows;
      });
    }

    // Bind to window resize, determine which controller/views to use
    $scope.$watch(function() {
      return $window.innerWidth;
    }, function(value) {
      $scope.window_width = value;
    });
  }])

  /**
   * Desktop Controller.
   * Used for large browser size.
   */
  .controller('desktopController', ['$scope', '$timeout', '$window', function ($scope, $timeout, $window) {
    // True whenever any piece is expanded (show more is clicked)
    var show_more_active = false; // @todo remove in favor of checking active_row.
    // Keep track of currently active row and piece, false if no active
    var active_row = false;
    var active_piece = false;
    var active_scroll_pos = 0;
    // Currently transforming pieces. Empty when none are transforming.
    var transforming = {};
    // Add theme_images_path to scope so it is accessible in View.
    $scope.theme_images_path = config.theme_images_path;

    /**
     * See more functionality. Calls flipping function, calls function to fade rows.
     * Public Scope function available in View.
     * @param  origin_row: Row that contains piece that was clicked to trigger flipping.
     * @param  origin_piece: Piece that was clicked to trigger flipping.
     * @param  origin_close_button: Boolean. Whether or not flipping was triggered by close button.
     */
    $scope.showMoreToggle = function($event, origin_row, origin_piece, origin_close_button) {
      $event.stopPropagation();
      // If no pieces are currently in the process of flipping.
      if (isObjEmpty(transforming)) {
        // If no piece is open, open clicked piece.
        if (!show_more_active) {
          show_more_active = true;
          active_row = origin_row;
          active_piece = origin_piece;
          $scope.rows[config.ppr_key][active_row]['toggles'][active_piece].showMoreActive = true;
          $scope.rows[config.ppr_key][origin_row]['toggles']['active_row'] = true;

          // Flip cards
          flipToggle();

          // Set global scroll pos
          active_scroll_pos = $window.pageYOffset;
        }
        // Close open piece
        else {
          // Don't allow click on active piece to trigger flipping.
          if (origin_row != active_row || (origin_row == active_row && origin_piece != active_piece) || origin_close_button) {
            flipToggle();
            // Wait til flipping is complete to reset scope and global vars.
            $timeout(function() {
              $scope.rows[config.ppr_key][active_row]['toggles'][active_piece].showMoreActive = false;
              $scope.rows[config.ppr_key][active_row]['toggles']['active_row'] = false;
              show_more_active = false;
              active_row = false;
              active_piece = false;
            }, (config.transition_time * 2) + 50);
          }
        }
      }
    };

    /**
     * Bind showMoreToggle() to scroll.
     * Private function.
     */
    (function scollToggleBind() {
      angular.element($window).bind("scroll", debounce(function($event) {
        var curr_scroll_pos = $window.pageYOffset;
        if (show_more_active && isObjEmpty(transforming)) {
          var scroll_diff = Math.abs(curr_scroll_pos - active_scroll_pos);
          if (scroll_diff > 250) {
            $scope.showMoreToggle($event, active_row, active_piece, true);
          }
        }
      }, 40));
    })();

    /**
     * Creates debounce functionality. Used when scrolling.
     * Private function.
     */
    function debounce(fn, delay) {
      var timer = null;
      return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    }

    /**
     * Checks if obj is empty.
     * Private function.
     */
    function isObjEmpty(obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Toggles CSS classes to flip pieces.
     * Private function.
     */
    function flipToggle() {
      for (var r = 0; r <= config.row_count_zero; r++) {
        var toggles = $scope.rows[config.ppr_key][r]['toggles'];
        // If active row
        if (r == active_row) {
          for (var p = 0; p <= config.pieces_per_row_zero; p++) {
            // If active piece
            if (p == active_piece) {
              // Flip to front
              if (toggles[active_piece].transform) {
                flipActiveToFront(active_row, active_piece);
              }
              // Flip to back
              else {
                flipActiveToBack(active_row, active_piece);
              }
            }
            // If not active piece
            else {
              // If piece is face down and neighbor img is visible, flip to front
              if (toggles[p].transform) {
                flipNeighborToFront(active_row, active_piece, p);
              }
              // If piece is face up and primary img is visible, flip to neighbor img
              else {
                flipFrontToNeighbor(active_row, active_piece, p);
              }
            }
          }
        }
        else {
          // If not in the active row, fade or unfade pieces
          for (var p = 0; p <= config.pieces_per_row_zero; p++) {
            if (!toggles[p].notFlippable) {
              toggles[p].notFlippable = true;
              toggles[p].fade = true;
            }
            else {
              toggles[p].notFlippable = false;
              toggles[p].fade = false;
            }
          }
        }
      }
    }

    /**
     * Flips active piece from back/description to front/primary image.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     */
    function flipActiveToFront(active_row, active_piece) {
      transformingClassToggle(active_row, active_piece);
      $timeout(function() {
        $scope.rows[config.ppr_key][active_row]['toggles'][active_piece].descriptionActive = false;
      }, config.transition_time);
    }

    /**
     * Flips active piece from front/primary image to back/description.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     */
    function flipActiveToBack(active_row, active_piece) {
      transformingClassToggle(active_row, active_piece);
      $scope.rows[config.ppr_key][active_row]['toggles'][active_piece].descriptionActive = true;
    }

    /**
     * Flips non-active piece from front/primary image to back/neighbor image.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     * @param  piece: The piece that is being flipped.
     */
    function flipFrontToNeighbor(active_row, active_piece, piece) {
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      $timeout(function() {
        // Show neighbor image on back face
        toggles[piece]['hideBackNbrImg' + '_' + active_piece.toString()] = false;
        // Hide description
        toggles[piece].descriptionActive = false;
        toggles[piece].notFlippable = true;
        // Flip
        transformingClassToggle(active_row, piece);
      }, config.transition_time + 50);
    }

    /**
     * Flips non-active piece from back/neighbor image to front/primary image.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     * @param  piece: The piece that is being flipped.
     */
    function flipNeighborToFront(active_row, active_piece, piece) {
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      $timeout(function() {
        // Return Primary and hide neighboring images
        toggles[piece].descriptionActive = false;
        toggles[piece].notFlippable = false;
        transformingClassToggle(active_row, piece);
        $timeout(function() {
          // Hide neighbor image after flip
          toggles[piece]['hideBackNbrImg' + '_' + active_piece.toString()] = true;
        }, config.transition_time);
      }, config.transition_time + 50);
    }

    /**
     * Adds and removes CSS class during flipping animation.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  piece: The piece to apply CSS classes to.
     */
    function transformingClassToggle(active_row, piece) {
      var trans_key = active_row.toString() + '_' + piece.toString();
      transforming[trans_key] = true;
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      toggles[piece].transforming = true;
      $scope.$parent.overflow_hidden = true;
      // Hide flip help
      toggles[piece].frontHover = false;
      toggles[piece].transform = toggles[piece].transform ? false : true;

      $timeout(function() {
        toggles[piece].transforming = false;
      }, config.transition_time);
      // Wait a bit after flipping is complete before allowing pieces to be transformed again.
      $timeout(function() {
        delete transforming[trans_key];
        // Return overflow-y to <body>. Fixes firefox bug where scrollbars appear for a split second.
        if (isObjEmpty(transforming)) {
          $scope.$parent.overflow_hidden = false;
        }
      }, config.transition_time + 100);
    }
  }])

  /**
   * Mobile Controller.
   */
  .controller('mobileController', ['$scope', '$window', function ($scope, $window) {

  }]);
})();