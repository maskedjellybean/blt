(function() {

  angular.module('portfolio')

  // Makes request to Drupal JSON, returns obj of pieces split into rows
  .factory('rowsFactory', function($http, $q, preloaderFactory) {
    delete $http.defaults.headers.common['X-Requested-With'];

    return {
      allImages: [],
      secondaryImages: [],
      primaryImages: [],
      rows: {},
      mobile_rows: [],

      // Main function to call in controller, calls all other functions
      getRows: function() {
        var deferred = $q.defer();
        var this_context = this;

        // Make call to Drupal JSON
        this_context.requestPortfolioData()
        .then(function(data) {
          // Clean up and sort images
          this_context.sortImagesData(data);

          // Preload all images
          var preload_images_promise = this_context.preloadImages();

          // Sort images more and add to data
          data = this_context.addImagesData(data);
          // Create rows
          rows = this_context.createRows(data);

          $q.all([preload_images_promise]).then(function() {
            // Return rows
            deferred.resolve(rows);
          });
        });
        return deferred.promise;
      },

      preloadImages: function() {
        var deferred = $q.defer();
        // Call preloader factory
        preloaderFactory.preloadImages(this.allImages)
        .then(function() {
          deferred.resolve();
        },
        function() {
          // @todo What should happen if this fails?
          deferred.reject();
        });
        return deferred.promise;
      },

      requestPortfolioData: function() {
        var deferred = $q.defer();
        $http({
          method: 'JSONP',
          url: config.target
        }).success(function(data) {
          config.pieces_count = data.portfolio.length;
          config.pieces_count_zero = config.pieces_count - 1;
          deferred.resolve(data);
        }).error(function() {
          // @todo Should there be some kind of error message?
          deferred.reject();
        });
        return deferred.promise;
      },

      sortImagesData: function(data) {
        // Loop through all pieces
        for (var p = 0; p < config.pieces_count; p++) {

          // Remove extra data from images array so only src remains (alt text, etc.)
          var images = data.portfolio[p].images;
          for (var b = 0; b < images.length; b++) {
            images[b] = images[b]['src'];
            this.allImages.push(images[b]);
          }

          // Save row for mobile
          this.mobile_rows[p] = angular.copy(data.portfolio[p]);
          this.mobile_rows[p]['images'] = angular.copy(images);

          // Create new collection of secondary image arrays with the current piece number appended
          this.secondaryImages[p] = [];
          // Loop through images array again
          for (var i = 0; i < images.length; i++) {
            if (i === 0) {
              // Add primary image to collection of primary imgs
              this.primaryImages.push(images[i]);
            }
            else {
              // Add secondary images to collection of secondary imgs
              this.secondaryImages[p].push(images[i]);
            }
          }
        }
      },

      addImagesData: function(data) {
        // Loop through all pieces again to add primary & neighboring secondary imgs
        for (p = 0; p <= config.pieces_count_zero; p++) {
          // Add primary img
          data.portfolio[p].primary_img = this.primaryImages[p];

          // Find neighbor imgs of current piece for 3 pieces per row
          var mod = p % 3;
          var neighbor1,
              neighbor2;
          data.portfolio[p].nbr_imgs_3_row = [];
          // If left
          if (mod === 0) {
            data.portfolio[p].row_position = 'left';
            neighbor1 = p + 1;
            // Check if the neighbor exists, in case correct number of pieces has not been added
            if (typeof this.secondaryImages[neighbor1] != 'undefined') {
              neighbor1 = this.secondaryImages[neighbor1][0];
            }
            neighbor2 = p + 2;
            if (typeof this.secondaryImages[neighbor2] != 'undefined') {
              neighbor2 = this.secondaryImages[neighbor2][0];
            }
          }
          // If center
          else if (mod === 1) {
            data.portfolio[p].row_position = 'center';
            neighbor1 = p - 1;
            if (typeof this.secondaryImages[neighbor1] != 'undefined') {
              neighbor1 = this.secondaryImages[neighbor1][0];
            }
            neighbor2 = p + 1;
            if (typeof this.secondaryImages[neighbor2] != 'undefined') {
              neighbor2 = this.secondaryImages[neighbor2][1];
            }
          }
          // If right
          else if (mod === 2) {
            data.portfolio[p].row_position = 'right';
            neighbor1 = p - 1;
            if (typeof this.secondaryImages[neighbor1] != 'undefined') {
              neighbor1 = this.secondaryImages[neighbor1][1];
            }
            neighbor2 = p - 2;
            if (typeof this.secondaryImages[neighbor2] != 'undefined') {
              neighbor2 = this.secondaryImages[neighbor2][1];
            }
          }
          if (neighbor1) {
            data.portfolio[p].nbr_imgs_3_row[0]= neighbor1;
          }
          if (neighbor2) {
            data.portfolio[p].nbr_imgs_3_row[1] = neighbor2;
          }

          // Find neighbor imgs of current piece for 2 piece per row
          mod = p % 2;
          neighbor1 = null;
          data.portfolio[p].nbr_imgs_2_row = [];
          // If left
          if (mod === 0) {
            data.portfolio[p].row_position = 'left';
            neighbor1 = p + 1;
            // Check if the neighbor exists, in case correct number of pieces has not been added
            if (typeof this.secondaryImages[neighbor1] != 'undefined') {
              neighbor1 = this.secondaryImages[neighbor1][0];
            }
          }
          // If right
          else if (mod === 1) {
            data.portfolio[p].row_position = 'right';
            neighbor1 = p - 1;
            if (typeof this.secondaryImages[neighbor1] != 'undefined') {
              neighbor1 = this.secondaryImages[neighbor1][0];
            }
          }
          if (neighbor1) {
            data.portfolio[p].nbr_imgs_2_row[0]= neighbor1;
          }
        }
        return data;
      },

      createRows: function(data) {
        // Loop through pieces one last time, group into rows and add them to rows obj
        var rows = {ppr_1 : [], ppr_2 : [], ppr_3 : []};
        // Make copies of pieces obj without ref, we'll splice these into rows
        var split_pieces_2_row = angular.copy(data.portfolio);
        var split_pieces_3_row = angular.copy(data.portfolio);
        config.ppr_2_row_count = 0;
        config.ppr_3_row_count = 0;
        for (p = 0; p <= config.pieces_count_zero; p++) {
          // Split pieces into rows, 2 per row
          var new_row = this.rowSplitter(split_pieces_2_row, 2, config.ppr_2_row_count);
          if (new_row) {
            split_pieces_2_row =  new_row[0]; // Pieces have been decreased by 2
            rows.ppr_2[config.ppr_2_row_count] = new_row[1]; // Add new row
            config.ppr_2_row_count++;
          }
          // Split pieces into rows, 3 per row
          new_row = this.rowSplitter(split_pieces_3_row, 3, config.ppr_3_row_count);
          if (new_row) {
            split_pieces_3_row =  new_row[0]; // Pieces have been decreased by 3
            rows.ppr_3[config.ppr_3_row_count] = new_row[1]; // Add new row
            config.ppr_3_row_count++;
          }
        }
        // Add mobile rows, 1 per row
        rows.ppr_1 = this.mobile_rows;
        // Update global config
        config.ppr_1_row_count = config.pieces_count;
        config.ppr_1_row_count_zero = config.pieces_count_zero;
        config.ppr_2_row_count_zero = config.ppr_2_row_count - 1;
        config.ppr_3_row_count_zero = config.ppr_3_row_count - 1;
        if (config.pieces_per_row === 2) {
          config.row_count = config.ppr_2_row_count;
          config.row_count_zero = config.ppr_2_row_count_zero;
        }
        else {
          config.row_count = config.ppr_3_row_count;
          config.row_count_zero = config.ppr_3_row_count_zero;
        }
        return rows;
      },

      // Obj constructor for creating CSS class toggles
      togglesObjCon: function() {
        this.transform = false;
        this.transforming = false;
        this.frontHover = false;
        // this.backActive = false; @todo probably not needed
        this.descriptionActive = false;
        this.noFlipHelp = false;
        this.notFlippable = false;
        this.frontSwapped = false;
        this.backSwapped = false;
        this.showMoreActive = false;
        this.fade = false;
        this.hidePrimaryImg = false;
        this.hideBackNbrImg_0 = true; //@todo make this not so hacky; no piece will actually use all these properties
        this.hideBackNbrImg_1 = true;
        this.hideBackNbrImg_2 = true;
        this.hideFrontNbrImg_0 = true;
        this.hideFrontNbrImg_1 = true;
        this.hideFrontNbrImg_2 = true;
      },

      // Splits pieces into rows based on pieces_per_row
      // Returns: Array containing spliced pieces obj and new row, false if not enough pieces for new row
      rowSplitter: function(pieces, pieces_per_row, row_count) {
        var new_row = pieces.splice(0, pieces_per_row),
            pieces_per_row_str = pieces_per_row.toString() + '_row';
        // Make sure row has correct number of pieces
        if (new_row.length === pieces_per_row) {
          // Construct CSS class toggle objs for row
          new_row['toggles'] = [];
          for (t = 0; t < pieces_per_row; t++) {
            new_row['toggles'][t] = new this.togglesObjCon();
            new_row['toggles']['active_row'] = false;
          }
          return [pieces, new_row];
        }
        return false;
      }
    };
  })

  // Image preloader factory
  // Taken from: http://www.bennadel.com/blog/2597-preloading-images-in-angularjs-with-promises.htm
  // And: https://medium.com/@dabit3/easily-preload-images-in-your-angular-app-9659640efa74#.4mxt7qql3
  .factory("preloaderFactory", function($q, $rootScope) {
    // I manage the preloading of image objects. Accepts an array of image URLs.
    function Preloader( imageLocations ) {
      // I am the image SRC values to preload.
      this.imageLocations = imageLocations;
      // As the images load, we'll need to keep track of the load/error
      // counts when announing the progress on the loading.
      this.imageCount = this.imageLocations.length;
      this.loadCount = 0;
      this.errorCount = 0;
      // I am the possible states that the preloader can be in.
      this.states = {
        PENDING: 1,
        LOADING: 2,
        RESOLVED: 3,
        REJECTED: 4
      };
      // I keep track of the current state of the preloader.
      this.state = this.states.PENDING;
      // When loading the images, a promise will be returned to indicate
      // when the loading has completed (and / or progressed).
      this.deferred = $q.defer();
      this.promise = this.deferred.promise;
    }
    // ---
    // STATIC METHODS.
    // ---
    // I reload the given images [Array] and return a promise. The promise
    // will be resolved with the array of image locations.
    Preloader.preloadImages = function( imageLocations ) {
      var preloader = new Preloader( imageLocations );
      return( preloader.load() );
    };
    // ---
    // INSTANCE METHODS.
    // ---
    Preloader.prototype = {
      // Best practice for "instnceof" operator.
      constructor: Preloader,
      // ---
      // PUBLIC METHODS.
      // ---
      // I determine if the preloader has started loading images yet.
      isInitiated: function isInitiated() {
        return( this.state !== this.states.PENDING );
      },
      // I determine if the preloader has failed to load all of the images.
      isRejected: function isRejected() {
        return( this.state === this.states.REJECTED );
      },
      // I determine if the preloader has successfully loaded all of the images.
      isResolved: function isResolved() {
        return( this.state === this.states.RESOLVED );
      },
      // I initiate the preload of the images. Returns a promise.
      load: function load() {
        // If the images are already loading, return the existing promise.
        if ( this.isInitiated() ) {
          return( this.promise );
        }
        this.state = this.states.LOADING;
        for ( var i = 0 ; i < this.imageCount ; i++ ) {
          this.loadImageLocation( this.imageLocations[ i ] );
        }
        // Return the deferred promise for the load event.
        return( this.promise );
      },
      // ---
      // PRIVATE METHODS.
      // ---
      // I handle the load-failure of the given image location.
      handleImageError: function handleImageError( imageLocation ) {
        this.errorCount++;
        // If the preload action has already failed, ignore further action.
        if ( this.isRejected() ) {
          return;
        }
        this.state = this.states.REJECTED;
        this.deferred.reject( imageLocation );
      },
      // I handle the load-success of the given image location.
      handleImageLoad: function handleImageLoad( imageLocation ) {
        this.loadCount++;
        // If the preload action has already failed, ignore further action.
        if ( this.isRejected() ) {
          return;
        }
        // Notify the progress of the overall deferred. This is different
        // than Resolving the deferred - you can call notify many times
        // before the ultimate resolution (or rejection) of the deferred.
        this.deferred.notify({
          percent: Math.ceil( this.loadCount / this.imageCount * 100 ),
          imageLocation: imageLocation
        });
        // If all of the images have loaded, we can resolve the deferred
        // value that we returned to the calling context.
        if ( this.loadCount === this.imageCount ) {
          this.state = this.states.RESOLVED;
          this.deferred.resolve( this.imageLocations );
        }
      },
      // I load the given image location and then wire the load / error
      // events back into the preloader instance.
      // --
      // NOTE: The load/error events trigger a $digest.
      loadImageLocation: function loadImageLocation( imageLocation ) {
        var preloader = this;
        // When it comes to creating the image object, it is critical that
        // we bind the event handlers BEFORE we actually set the image
        // source. Failure to do so will prevent the events from proper
        // triggering in some browsers.
        var image = angular.element(new Image())
        .load(
          function( event ) {
            // Since the load event is asynchronous, we have to
            // tell AngularJS that something changed.
            $rootScope.$apply(
              function() {
                preloader.handleImageLoad( event.target.src );
                // Clean up object reference to help with the
                // garbage collection in the closure.
                preloader = image = event = null;
              }
            );
          }
        )
        .error(
          function( event ) {
            // Since the load event is asynchronous, we have to
            // tell AngularJS that something changed.
            $rootScope.$apply(
              function() {
                preloader.handleImageError( event.target.src );
                // Clean up object reference to help with the
                // garbage collection in the closure.
                preloader = image = event = null;
              }
            );
          }
        )
        .prop( "src", imageLocation );
      }
    };
    // Return the factory instance.
    return(Preloader);
  });
})();
