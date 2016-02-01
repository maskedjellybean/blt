(function() {

  // Global config settings @todo How should this actually be done in Angular?
  config = {
    // Set number of pieces per row. Choose between 3 and 2.
    pieces_per_row: 2,
    target: 'http://benteegarden.com/api/portfolio/mk/mk.jsonp?callback=JSON_CALLBACK',
    theme_images_path: 'sites/all/themes/blt/images/angular-portfolio-app/',
  };

  // Automatically configure more global config values
  config.pieces_per_row_zero = config.pieces_per_row - 1;
  if (config.pieces_per_row === 2) {
    config.ppr_key = 'ppr_2';
  }
  else {
    config.ppr_key = 'ppr_3';
  }

  // Controllers

  // Parent Controller
  angular.module('portfolio', ['angular-flexslider'])
  .controller('PortfolioController', ['$scope', '$window', 'rowsFactory', function ($scope, $window, rowsFactory) {

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
  .controller('PortfolioDesktopController', ['$scope', '$timeout', '$window', function ($scope, $timeout, $window) {
    // Var is set to true whenever any piece is expanded (show more is clicked)
    this.show_more_active = false;
    // Vars keep track of currently active row and piece, false if no active
    this.active_row = false;
    this.active_piece = false;
    this.active_scroll_pos = 0;
    // Add theme_images_path to scope so it is accessible in template
    this.theme_images_path = config.theme_images_path;

    // Bind showMoreToggle() to scroll
    angular.element($window).bind("scroll", debounce(function($event) {
      var curr_scroll_pos = $window.pageYOffset;
      if ($scope.desktopPortfolio.show_more_active) {
        var scroll_diff = Math.abs(curr_scroll_pos - $scope.desktopPortfolio.active_scroll_pos);
        if (scroll_diff > 250) {
          $scope.desktopPortfolio.showMoreToggle($event, config.active_row, config.active_piece, true);
        }
      }
    }, 50));

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

    // See More button functionality. Calls flipping function, calls function to fade non-origin rows
    this.showMoreToggle = function($event, originRow, originPiece, originCloseButton) {
      $event.stopPropagation();
      // console.log('show more');
      // If no piece is open, open clicked piece
      if (!this.show_more_active) {
        this.show_more_active = true;
        $scope.rows[config.ppr_key][originRow]['toggles'][originPiece].showMoreActive = true;
        this.active_row = originRow;
        this.active_piece = originPiece;

        // Flip cards
        this.flipToggle(this.active_row, this.active_piece);

        // Set global, scroll pos, show more active vars, fade pieces
        this.active_scroll_pos = $window.pageYOffset;

      }
      // close open piece
      else {
        if (this.active_row != originRow || originCloseButton || (this.active_row === originRow && this.active_piece != originPiece)) {

          this.flipToggle(this.active_row, this.active_piece);

          this.show_more_active = false;
          $scope.rows[config.ppr_key][this.active_row]['toggles'][this.active_piece].showMoreActive = false;
          this.active_row = false;
          this.active_piece = false;
        }
      }
    };

    // @todo this is not used for anything yet, needs work
    // this.activeRowToggle = function(repeatScope) {
    //   var origin_row_status = $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'],
    //       active_row_found = false;
    //   if (this.show_more_active) {
    //     for (var r = 0; r <= config.row_count_zero; r++) {
    //       var curr_row = $scope.rows[config.ppr_key][r];
    //       var curr_row_status = $scope.rows[config.ppr_key][r]['toggles']['active_row'];
    //       if (curr_row_status) {
    //         active_row_found = true;
    //         if (r === repeatScope) {
    //           $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = false;
    //           break;
    //         }
    //       }
    //     }
    //     if (!active_row_found) {
    //       $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = true;
    //     }
    //   }
    //   else {
    //     if (origin_row_status) {
    //       $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = false;
    //     }
    //     else {
    //       $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = true;
    //     }
    //   }
    // };

    // Toggles CSS classes to flip pieces
    this.flipToggle = function(activeRow, activePiece) {
      for (var r = 0; r <= config.row_count_zero; r++) {
        var toggles = $scope.rows[config.ppr_key][r]['toggles'];
        // Only affect other pieces in the row
        if (r === activeRow) {
          for (var p = 0; p <= config.pieces_per_row_zero; p++) {
            if (p !== activePiece) {
              // If piece is face down
              if (toggles[p].transform) {
                // If back is active and neighbor img is visible, flip to front
                if (!toggles[p].descriptionActive) {
                  this.flipNeighborToFront(p, activePiece, toggles);
                }
              }
              // If piece is face up
              else {
                // If front is active and primary img is visible, flip to neighbor img
                if (!toggles[p].frontSwapped) {
                  this.flipFrontToNeighbor(p, activePiece, toggles);
                }
              }
            }
            else {
              if (toggles[activePiece].transform) {
                this.transformingClassToggle(activePiece, toggles);
                // toggles[activePiece]['backActive'] = false;
                $timeout(function() {
                  toggles[activePiece].descriptionActive = false;
                }, 500);
              }
              else {
                this.transformingClassToggle(activePiece, toggles);
                // toggles[activePiece]['backActive'] = true;
                toggles[activePiece].descriptionActive = true;
              }
            }
          }
        }
        else {
          // Fade pieces
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
    };

    this.flipFrontToNeighbor = function(piece, activePiece, toggles) {
      $timeout(function() {
        // Show neighbor image on back face
        toggles[piece]['hideBackNbrImg' + '_' + activePiece.toString()] = false;
        // toggles[p]['backActive'] = true;
        // Hide description
        toggles[piece].descriptionActive = false;
        toggles[piece].notFlippable = true;
        // Flip
        $scope.desktopPortfolio.transformingClassToggle(piece, toggles);
      }, 550);
    };

    this.flipNeighborToFront = function(piece, activePiece, toggles) {
      $timeout(function() {
        // Return Primary and hide neighboring images
        toggles[piece].notFlippable = false;
        // toggles[p]['backActive'] = false;
        $scope.desktopPortfolio.transformingClassToggle(piece, toggles);
        $timeout(function() {
          // Hide neighbor image after flip
          toggles[piece]['hideBackNbrImg' + '_' + activePiece.toString()] = true;
        }, 500);
      }, 550);
    };

    // Add and remove class during flipping animation
    this.transformingClassToggle = function(piece, toggles) {
      toggles[piece].transforming = true;
      // Hide flip help
      toggles[piece].frontHover = false;
      if (toggles[piece].transform) {
        toggles[piece].transform = false;
      }
      else {
        toggles[piece].transform = true;
      }
      $timeout(function() {
        toggles[piece].transforming = false;
      }, 500);
    };
  }])

  // Mobile controller
  .controller('PortfolioMobileController', ['$scope', '$window', function ($scope, $window) {

  }]);
})();