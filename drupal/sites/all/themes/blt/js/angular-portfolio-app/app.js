(function() {

  // Global config settings @todo How should this actually be done in Angular?
  config = {
    // Set number of pieces per row. Choose between 3 and 2.
    pieces_per_row: 2,
    target: 'http://benteegarden.com/api/portfolio/mk/mk.jsonp?callback=JSON_CALLBACK',
    theme_images_path: 'sites/all/themes/blt/images/angular-portfolio-app/',
    // Transition time for flipping animation. Needs to match .flip-card transition property in CSS.
    transition_time: 400,
    // Time between flipping animations.
    transition_time_between: 50,
  };

  // Configure more global config values
  config.pieces_per_row_zero = config.pieces_per_row - 1;
  if (config.pieces_per_row === 2) {
    config.ppr_key = 'ppr_2';
  }
  else {
    config.ppr_key = 'ppr_3';
  }
  config.transition_time_padding = config.transition_time + config.transition_time_between;
  config.transition_time_double = (config.transition_time * 2) + config.transition_time_between;


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
  .controller('desktopController', ['$scope', '$q', '$timeout', '$window', function ($scope, $q, $timeout, $window) {
    // True whenever any piece is expanded (show more is clicked)
    var show_more_active = false;
    // Keep track of currently active row and piece, false if no active
    var active_row = false;
    var active_piece = false;
    var active_scroll_pos = 0;
    var scroll_timeout = false;
    // True if any pieces are currently in the process of transforming.
    $scope.curr_transforming = false;
    var flip_start_counter = 0;
    var flip_complete_counter = 0;
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
      if (!$scope.curr_transforming) {
        // If no piece is open, open clicked piece.
        if (!show_more_active) {
          show_more_active = true;
          active_row = origin_row;
          active_piece = origin_piece;
          $scope.rows[config.ppr_key][active_row]['toggles']['active_row'] = true;

          // Flip active piece
          flipStartTracker();
          flipActiveToBack(active_row, active_piece).then(flipCompleteTracker);
          // Flip neighbor piece(s)
          for (var p = 0; p <= config.pieces_per_row_zero; p++) {
            if (p != active_piece) {
              flipStartTracker();
              flipFrontToNeighbor(active_row, active_piece, p).then(flipCompleteTracker);
            }
          }

          // Fade other pieces
          for (var r = 0; r <= config.row_count_zero; r++) {
            // If not active row
            if (r != active_row) {
              var toggles = $scope.rows[config.ppr_key][r]['toggles'];
              for (var p = 0; p <= config.pieces_per_row_zero; p++) {
                toggles[p].notFlippable = true;
                toggles[p].fade = true;
              }
            }
          }
        }
        // Close open piece
        else {
          // Don't allow click on active piece to trigger flipping.
          if (origin_row != active_row || (origin_row == active_row && origin_piece != active_piece) || origin_close_button) {
            // Flip neighbor piece(s)
            for (var p = 0; p <= config.pieces_per_row_zero; p++) {
              if (p != active_piece) {
                flipStartTracker();
                flipNeighborToFront(active_row, active_piece, p).then(flipCompleteTracker);
              }
            }
            // Flip active piece
            flipStartTracker();
            flipActiveToFront(active_row, active_piece).then(flipCompleteTracker);

            // Unfade other pieces
            for (var r = 0; r <= config.row_count_zero; r++) {
              // If not active row
              if (r != active_row) {
                var toggles = $scope.rows[config.ppr_key][r]['toggles'];
                for (var p = 0; p <= config.pieces_per_row_zero; p++) {
                  toggles[p].notFlippable = false;
                  toggles[p].fade = false;
                }
              }
            }

            // Wait til flipping is complete to reset scope and global vars.
            $timeout(function() {
              $scope.rows[config.ppr_key][active_row]['toggles']['active_row'] = false;
              show_more_active = false;
              active_row = false;
              active_piece = false;
            }, config.transition_time_double);
          }
        }
      }
    };

    /**
     * Bind showMoreToggle() to scroll.
     * Private function.
     */
    // var scrollToggleBind = function() {
    //   // var scrollFn = function() {

    // };

    (function scrollToggleBind() {
      console.log('scroll bind');
    // $scope.$watch('curr_transforming', function() {
      // if (show_more_active && !$scope.curr_transforming) {
        // console.log('scroll event on');
        angular.element($window).bind('scroll', function($event) {

          debounce(function($event) {
            console.log('scroll');
            if (show_more_active && !scroll_timeout && !$scope.curr_transforming) {
              var curr_scroll_pos = $window.pageYOffset;
              var scroll_diff = Math.abs(curr_scroll_pos - active_scroll_pos);
              if (scroll_diff > 250) {
                console.log('scroll trigger');
                scroll_timeout = true;
                // Set global scroll pos
                active_scroll_pos = curr_scroll_pos;
                $scope.showMoreToggle($event, active_row, active_piece, true);
                $timeout(function() {
                  scroll_timeout = false;
                }, config.transition_time_double);
              }
            }
          }, 40);
        });
      // }
      // else if (!show_more_active && !$scope.curr_transforming) {
      //   console.log('scroll event off');
      //   angular.element($window).off('scroll');
      // }
    // });
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

    function flipStartTracker() {
      if (flip_start_counter === 0) {
        $scope.$parent.overflow_hidden = true;
        $scope.curr_transforming = true;
      }
      if (flip_start_counter < config.pieces_per_row) {
        flip_start_counter++;
      }
    }

    function flipCompleteTracker() {
      flip_complete_counter++;
      if (flip_complete_counter == config.pieces_per_row) {
        // Wait a bit after flipping is complete before allowing pieces to be flipped again.
        $timeout(function() {
          flip_start_counter = 0;
          flip_complete_counter = 0;
          $scope.curr_transforming = false;
          // Return overflow-y to <body>. Fixes firefox bug where scrollbars appear for a split second.
          $scope.$parent.overflow_hidden = false;
        }, 50);
      }
    }

    /**
     * Flips active piece from back/description to front/primary image. (Close active piece).
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     */
    function flipActiveToFront(active_row, active_piece) {
      var deferred = $q.defer();
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      $timeout(function() {
        transformingClassToggle(active_row, active_piece);
        $timeout(function() {
          toggles[active_piece].showMoreActive = false;
          toggles[active_piece].descriptionActive = false;
        }, config.transition_time).then(function() {
          deferred.resolve();
        });
      }, config.transition_time_padding);
      return deferred.promise;
    }

    /**
     * Flips active piece from front/primary image to back/description. (Open active piece).
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     */
    function flipActiveToBack(active_row, active_piece) {
      var deferred = $q.defer();
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      toggles[active_piece].showMoreActive = true;
      toggles[active_piece].descriptionActive = true;
      transformingClassToggle(active_row, active_piece);
      $timeout(function() {
      }, config.transition_time).then(function() {
        deferred.resolve();
      });
      return deferred.promise;
    }

    /**
     * Flips non-active piece from front/primary image to back/neighbor image.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     * @param  piece: The piece that is being flipped.
     */
    function flipFrontToNeighbor(active_row, active_piece, piece) {
      var deferred = $q.defer();
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      $timeout(function() {
        // Show neighbor image on back face
        toggles[piece]['hideBackNbrImg' + '_' + active_piece.toString()] = false;
        // Hide description
        toggles[piece].descriptionActive = false;
        toggles[piece].notFlippable = true;
        // Flip
        transformingClassToggle(active_row, piece);
        $timeout(function() {
        }, config.transition_time).then(function() {
          deferred.resolve();
        });
      }, config.transition_time_padding);
      return deferred.promise;
    }

    /**
     * Flips non-active piece from back/neighbor image to front/primary image.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  active_piece: The active piece at the time the function was called.
     * @param  piece: The piece that is being flipped.
     */
    function flipNeighborToFront(active_row, active_piece, piece) {
      var deferred = $q.defer();
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      // Return Primary and hide neighboring images
      toggles[piece].descriptionActive = false;
      toggles[piece].notFlippable = false;
      transformingClassToggle(active_row, piece);
      $timeout(function() {
        // Hide neighbor image after flip
        toggles[piece]['hideBackNbrImg' + '_' + active_piece.toString()] = true;
        deferred.resolve();
      }, config.transition_time);
      return deferred.promise;
    }

    /**
     * Adds and removes CSS class during flipping animation.
     * Private function.
     * @param  active_row: The active row at the time function was called.
     * @param  piece: The piece to apply CSS classes to.
     */
    function transformingClassToggle(active_row, piece) {
      var toggles = $scope.rows[config.ppr_key][active_row]['toggles'];
      toggles[piece].transforming = true;
      toggles[piece].transform = toggles[piece].transform ? false : true;
      // Hide flip help
      toggles[piece].frontHover = false;

      $timeout(function() {
        toggles[piece].transforming = false;
      }, config.transition_time);
    }
  }])

  /**
   * Mobile Controller.
   */
  .controller('mobileController', ['$scope', '$window', function ($scope, $window) {

  }]);
})();