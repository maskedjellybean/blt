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

    // Bind showLess() to scroll
    angular.element($window).bind("scroll", function() {
      var curr_scroll_pos = $window.pageYOffset;
      if ($scope.desktopPortfolio.show_more_active) {
        var scroll_diff = Math.abs(curr_scroll_pos - $scope.desktopPortfolio.active_scroll_pos);
        if (scroll_diff > 300) {
          $scope.desktopPortfolio.showLess(config.active_row, config.active_piece);
        }
      }
    });

    // See More button functionality. Calls flipping function, calls function to fade non-origin rows
    this.showMore = function($event, repeatScope, originPiece) {
      var piece = $scope.rows[config.ppr_key][repeatScope]['toggles'][originPiece];

      // If clicked piece is currently allowed to be flipped, flip it and prevent flipping others
      if (!$scope.rows[config.ppr_key][repeatScope]['toggles'][originPiece]['notFlippable']) {
        // Stop this.showLess() from being called by parent ng-click()
        $event.stopPropagation();

        // Fade pieces
        this.preventFlipToggle(repeatScope, originPiece);
        // Flip self
        this.flipToggle($scope, repeatScope, true, originPiece);
        // Flip neighbors
        this.flipToggle($scope, repeatScope, false, originPiece);

        // Set global show more active vars, fade pieces
        this.active_scroll_pos = window.pageYOffset;
        if (this.show_more_active) {
          this.show_more_active = false;
          this.active_row = false;
          this.active_piece = false;
          $scope.rows[config.ppr_key][repeatScope]['toggles'][originPiece]['showMoreActive'] = false;
        }
        else {
          this.show_more_active = true;
          this.active_row = repeatScope;
          this.active_piece = originPiece;
          $scope.rows[config.ppr_key][repeatScope]['toggles'][originPiece]['showMoreActive'] = true;
        }
      }
    };

    // Closes active piece, unfades non-active pieces
    this.showLess = function(originRow, originPiece) {
      if (this.show_more_active) {
        if (this.active_row != originRow || (this.active_row == originRow && this.active_piece != originPiece)) {
          this.preventFlipToggle(this.active_row, this.active_piece);
          this.flipToggle($scope, this.active_row, false, this.active_piece);
          this.flipToggle($scope, this.active_row, true, this.active_piece);
          this.show_more_active = false;
          $scope.rows[config.ppr_key][this.active_row]['toggles'][this.active_piece]['showMoreActive'] = false;
        }
      }
    };

    // Stop flip functionality and fade pieces not in the origin row
    this.preventFlipToggle = function(originRow, originPiece) {
      for (var r = 0; r <= config.row_count_zero; r++) {
        var curr_row = $scope.rows[config.ppr_key][r];
        // If not origin row, prevent flipping of pieces
        if (r !== originRow) {
          for (var p = 0; p < curr_row.length; p++) {
            if (!$scope.rows[config.ppr_key][r]['toggles'][p].notFlippable) {
              $scope.rows[config.ppr_key][r]['toggles'][p].notFlippable = true;
              $scope.rows[config.ppr_key][r]['toggles'][p].fade = true;
            }
            else {
              $scope.rows[config.ppr_key][r]['toggles'][p].notFlippable = false;
              $scope.rows[config.ppr_key][r]['toggles'][p].fade = false;
            }
          }
        }
      }
    };

    // @todo this is not used for anything yet, needs work
    this.activeRowToggle = function(repeatScope) {
      var origin_row_status = $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'],
          active_row_found = false;
      if (this.show_more_active) {
        for (var r = 0; r <= config.row_count_zero; r++) {
          var curr_row = $scope.rows[config.ppr_key][r];
          var curr_row_status = $scope.rows[config.ppr_key][r]['toggles']['active_row'];
          if (curr_row_status) {
            active_row_found = true;
            if (r === repeatScope) {
              $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = false;
              break;
            }
          }
        }
        if (!active_row_found) {
          $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = true;
        }
      }
      else {
        if (origin_row_status) {
          $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = false;
        }
        else {
          $scope.rows[config.ppr_key][repeatScope]['toggles']['active_row'] = true;
        }
      }
    };

    // Toggles CSS classes to flip pieces
    this.flipToggle = function($scope, repeatScope, targetOther, originPiece) {
      var toggles = $scope.rows[config.ppr_key][repeatScope]['toggles'];

      // If target piece to transform is not this piece, turn other pieces over and display images
      if (targetOther) {
        for (var p = 0; p <= config.pieces_per_row_zero; p++) {
          // Only affect other pieces in the row
          if (p !== originPiece) {

            // If piece is face down
            if (toggles[p]['transform']) {

              // If back is active, and Description is visible
              // if (toggles[p]['descriptionActive']) {
              //   // Hide Primary image
              //   toggles[p]['frontSwapped'] = true;
              //   toggles[p]['notFlippable'] = true;
              //   // toggles[p]['backActive'] = false;
              //   toggles[p].descriptionActive = true;
              //   toggles[p]['hidePrimaryImg'] = true;
              //   // Show neighbor image instead
              //   toggles[p]['hideFrontNbrImg' + '_' + originPiece.toString()] = false;
              //   toggles[p]['transform'] = false;
              //   this.transformingClassToggle(p, toggles);
              //   // preventFlipToggle(repeatScope, originPiece);
              //   console.log('1');
              // }

              // If back is active and Description is hidden
              if (!toggles[p]['descriptionActive']) {
                this.flipNeighborToFront($scope, p, originPiece, toggles);
              }
            }

            // If piece is face up
            else {
              // If front is active and Primary image is visible, flip to neighbor image
              if (!toggles[p]['frontSwapped']) {
                this.flipFrontToNeighbor($scope, p, originPiece, toggles);
              }

              // If front is active but Primary image is hidden
              // else if (toggles[p]['frontSwapped']) {
              //   // Return Primary image and hide neighboring images
              //   toggles[p]['frontSwapped'] = false;
              //   // Transform and then swap images after card is done flipping
              //   toggles[p]['transform'] = true;
              //   toggles[p]['notFlippable'] = false;
              //   // toggles[p]['backActive'] = true;
              //   // toggles[p].descriptionActive = false;
              //   this.transformingClassToggle(p, toggles);
              //   this.loopTimeoutBack(p, toggles, originPiece);
              //   console.log('4');
              // }
            }
          }
        }
      }
      // If target piece is self
      else {
        if (toggles[originPiece]['transform']) {
          this.transformingClassToggle(originPiece, toggles);
          // toggles[originPiece]['backActive'] = false;
          $timeout(function() {
            toggles[originPiece].descriptionActive = false;
          }, 500);
        }
        else {
          this.transformingClassToggle(originPiece, toggles);
          // toggles[originPiece]['backActive'] = true;
          toggles[originPiece].descriptionActive = true;
        }
      }
    };

    this.flipFrontToNeighbor = function($scope, p, originPiece, toggles) {
      $timeout(function() {
        // Show neighbor image on back face
        toggles[p]['hideBackNbrImg' + '_' + originPiece.toString()] = false;
        // toggles[p]['backActive'] = true;
        // Hide description
        toggles[p].descriptionActive = false;
        toggles[p]['notFlippable'] = true;
        // Flip
        $scope.desktopPortfolio.transformingClassToggle(p, toggles);
      }, 550);
    };

    this.flipNeighborToFront = function($scope, p, originPiece, toggles) {
      $timeout(function() {
        // Return Primary and hide neighboring images
        toggles[p]['notFlippable'] = false;
        // toggles[p]['backActive'] = false;
        $scope.desktopPortfolio.transformingClassToggle(p, toggles);
        $timeout(function() {
          // Hide neighbor image after flip
          toggles[p]['hideBackNbrImg' + '_' + originPiece.toString()] = true;
        }, 500);
      }, 550);
    };

    // Toggles a single property on a Toggles obj
    // Called with ng-class in template to toggle CSS classes
    this.classToggle = function(repeatScope, targetPiece, propertyName) {
      var toggles = $scope.rows[config.ppr_key][repeatScope]['toggles'];
      if (toggles[targetPiece][propertyName]) {
        toggles[targetPiece][propertyName] = false;
      }
      else {
        toggles[targetPiece][propertyName] = true;
      }
    };

    // Add and remove class during flipping animation
    this.transformingClassToggle = function(p, toggles) {
      toggles[p].transforming = true;
      // Hide flip help
      toggles[p].frontHover = false;
      if (toggles[p]['transform']) {
        toggles[p]['transform'] = false;
      }
      else {
        toggles[p]['transform'] = true;
      }
      $timeout(function() {
        toggles[p].transforming = false;
      }, 500);
    };
  }])

  // Mobile controller
  .controller('PortfolioMobileController', ['$scope', '$window', function ($scope, $window) {

  }]);
})();