(function() {

  // Global config settings @todo How should this actually be done in Angular?
  config = {
    // Set number of pieces per row. Choose between 3 and 2.
    pieces_per_row: 2,
    target: 'http://benteegarden.com/api/portfolio/mk/mk.jsonp?callback=JSON_CALLBACK',
    theme_images_path: 'sites/all/themes/blt/images/angular-portfolio-app/',
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

  // Parent Controller
  // Set on <body> and contains all other controllers
  angular.module('portfolio', ['angular-flexslider'])
  .controller('PortfolioController', ['$scope', '$window', 'rowsFactory', function ($scope, $window, rowsFactory) {
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

  // Desktop Controller
  .controller('desktopController', ['$scope', '$timeout', '$window', function ($scope, $timeout, $window) {
    // Set to true whenever any piece is expanded (show more is clicked)
    var show_more_active = false;
    // Keep track of currently active row and piece, false if no active
    var active_row = false;
    var active_piece = false;
    var active_scroll_pos = 0;
    // Currently transforming pieces. Empty when none are transforming.
    var transforming = {};
    // Add theme_images_path to scope so it is accessible in View.
    $scope.theme_images_path = config.theme_images_path;

    // See More button functionality. Calls flipping function, calls function to fade non-origin rows
    // Public function available in View.
    $scope.showMoreToggle = function($event, originRow, originPiece, originCloseButton) {
      $event.stopPropagation();
      // If no pieces are currently transforming
      if (isObjEmpty(transforming)) {
        // If no piece is open, open clicked piece
        if (!show_more_active) {
          show_more_active = true;
          $scope.rows[config.ppr_key][originRow]['toggles'][originPiece].showMoreActive = true;
          active_row = originRow;
          active_piece = originPiece;

          // Flip cards
          flipToggle(active_row, active_piece);

          // Set global, scroll pos, show more active vars, fade pieces
          active_scroll_pos = $window.pageYOffset;
        }
        // close open piece
        else {
          if (active_row != originRow || originCloseButton || (active_row === originRow && active_piece != originPiece)) {

            flipToggle(active_row, active_piece);

            show_more_active = false;
            $scope.rows[config.ppr_key][active_row]['toggles'][active_piece].showMoreActive = false;
            active_row = false;
            active_piece = false;
          }
        }
      }
    };

    // Bind showMoreToggle() to scroll
    (function scollToggleBind() {
      angular.element($window).bind("scroll", debounce(function($event) {
        var curr_scroll_pos = $window.pageYOffset;
        if (show_more_active) {
          var scroll_diff = Math.abs(curr_scroll_pos - active_scroll_pos);
          if (scroll_diff > 250) {
            $scope.showMoreToggle($event, active_row, active_piece, true);
          }
        }
      }, 30));
    })();

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

    function isObjEmpty(obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    }

    // Toggles CSS classes to flip pieces
    function flipToggle(activeRow, activePiece) {
      for (var r = 0; r <= config.row_count_zero; r++) {
        var toggles = $scope.rows[config.ppr_key][r]['toggles'];
        // Only affect pieces in the active row
        if (r === activeRow) {
          for (var p = 0; p <= config.pieces_per_row_zero; p++) {
            // If not the active piece
            if (p !== activePiece) {
              // If piece is face down
              if (toggles[p].transform) {
                // If back is active and neighbor img is visible, flip to front
                flipNeighborToFront(activeRow, activePiece, p, toggles);
              }
              // If piece is face up
              else {
                // If front is active and primary img is visible, flip to neighbor img
                flipFrontToNeighbor(activeRow, activePiece, p, toggles);
              }
            }
            // If active piece
            else {
              // Flip to front
              if (toggles[activePiece].transform) {
                transformingClassToggle(activeRow, activePiece, toggles);
                // toggles[activePiece]['backActive'] = false;
                $timeout(function() {
                  toggles[activePiece].descriptionActive = false;
                }, 400);
              }
              // Flip to back
              else {
                transformingClassToggle(activeRow, activePiece, toggles);
                // toggles[activePiece]['backActive'] = true;
                toggles[activePiece].descriptionActive = true;
              }
            }
          }
        }
        else {
          // If not in the active row, fade pieces
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

    function flipFrontToNeighbor(activeRow, activePiece, piece, toggles) {
      $timeout(function() {
        // Show neighbor image on back face
        toggles[piece]['hideBackNbrImg' + '_' + activePiece.toString()] = false;
        // toggles[p]['backActive'] = true;
        // Hide description
        toggles[piece].descriptionActive = false;
        toggles[piece].notFlippable = true;
        // Flip
        transformingClassToggle(activeRow, piece, toggles);
      }, 450);
    }

    function flipNeighborToFront(activeRow, activePiece, piece, toggles) {
      $timeout(function() {
        // Return Primary and hide neighboring images
        toggles[piece].descriptionActive = false;
        toggles[piece].notFlippable = false;
        // toggles[p]['backActive'] = false;
        transformingClassToggle(activeRow, piece, toggles);
        $timeout(function() {
          // Hide neighbor image after flip
          toggles[piece]['hideBackNbrImg' + '_' + activePiece.toString()] = true;
        }, 400);
      }, 450);
    }

    // Add and remove class during flipping animation
    function transformingClassToggle(activeRow, piece, toggles) {
      var trans_key = activeRow.toString() + '_' + piece.toString();
      transforming[trans_key] = true;
      toggles[piece].transforming = true;
      $scope.$parent.overflow_hidden = true;
      // Hide flip help
      toggles[piece].frontHover = false;
      toggles[piece].transform = toggles[piece].transform ? false : true;

      $timeout(function() {
        toggles[piece].transforming = false;
      }, 400);
      // Wait a bit after transform is complete to allow pieces to be transformed again.
      $timeout(function() {
        delete transforming[trans_key];
        // Return overflow-y to <body>. Fixes firefox bug where scrollbars appear for a split second.
        if (isObjEmpty(transforming)) {
          $scope.$parent.overflow_hidden = false;
        }
      }, 500);
    }
  }])

  // Mobile controller
  .controller('PortfolioMobileController', ['$scope', '$window', function ($scope, $window) {

  }]);
})();