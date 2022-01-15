"use strict";

(function() {

    // The debounce function receives our function as a parameter
    const debounce = (fn) => {

        // This holds the requestAnimationFrame reference, so we can cancel it if we wish
        let frame;

        // The debounce function returns a new function that can receive a variable number of arguments
        return (...params) => {

        // If the frame variable has been defined, clear it now, and queue for next frame
        if (frame) {
            cancelAnimationFrame(frame);
        }

        // Queue our function call for the next frame
        frame = requestAnimationFrame(() => {

            // Call our function and pass any params we received
            fn(...params);
        });

        }
    };


    // Reads out the scroll position and stores it in the data attribute
    // so we can use it in our stylesheets
    const storeScroll = (event) => {
        if (event.target.scrollTop > 400) {
            document.documentElement.dataset.scroll = "yes";
        }
        else if (event.target.scrollTop < 100) {
            document.documentElement.removeAttribute("data-scroll");
        }
    }

    // Listen for new scroll events, here we debounce our `storeScroll` function.
    var scrollbox = document.getElementsByClassName("scrollbox")[0];
    scrollbox.addEventListener('scroll', debounce(storeScroll), { passive: true });

    // Update scroll position for first time
    storeScroll({target: scrollbox});

    /**
     * Power main menu navigation.
     */
    var mains = document.getElementsByTagName("main"),
    navs = document.getElementsByClassName("js-main-nav");
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains("js-main-nav") && !event.target.hasAttribute("disabled")) {
            var active_id = event.target.hash.substring(1);
            var i;
            for (i = 0; i < mains.length; i++) {
                if (mains[i].id !== active_id && !mains[i].hasAttribute("hidden")) {
                    mains[i].setAttribute("hidden", "");
                }
                else if (mains[i].id === active_id && mains[i].hasAttribute("hidden")) {
                    mains[i].removeAttribute("hidden");
                }
            }
            for (i = 0; i < navs.length; i++) {
                if (navs[i] === event.target) {
                    navs[i].setAttribute("aria-current", "page");
                }
                else {
                    navs[i].removeAttribute("aria-current");
                }
            }
            storeScroll({target: scrollbox});
        }
    });

    /**
     * Read more links.
     */
    var readmores = document.getElementsByClassName("js-read-more");
    var i;
    for (i = 0; i < readmores.length; i++) {
        var readmore = readmores[i];
        if (!readmore.dataset['js_read_more']) {
            readmore.dataset['js_read_more'] = true;
            (function(readmore) {
                readmore.classList.add("read-more-hide");
                var link = document.createElement('a');
                link.classList.add("read-more");
                var span = document.createElement("span");
                span.appendChild(document.createTextNode("show more"));
                link.appendChild(span);
                readmore.appendChild(link);
                link.addEventListener("click", function(event) {
                    readmore.classList.toggle("read-more-hide");
                    readmore.classList.toggle("read-more-show");
                    if (readmore.classList.contains("read-more-hide")) {
                        span.textContent = "show more";
                        readmore.closest("article").scrollIntoView();
                    }
                    else {
                        span.textContent = "show less";
                    }
                });
            })(readmore);
        }
    }

    // Need exactly one popup overlay div on the page.
    if (document.getElementsByClassName("popup-overlap").length === 0) {
        var overlay = document.createElement("div");
        overlay.classList.add("popup-overlay");
        document.body.prepend(overlay);
    }

    /**
     * Class representing a popup element.
     */
    var Popup = function(element) {
        this.hidden = true;
        this.element = element;
        this.header = this.element.getElementsByTagName("header")[0];
        // Initialize.
        this.element.classList.add("popup-hide");
        var close_link = document.createElement("a");
        close_link.classList.add("popup-close-link");
        close_link.text = "Close";
        this.header.appendChild(close_link);
        var that = this;
        this.header.addEventListener("click", function(event) {
            that.toggle();
        });
        overlay.addEventListener("click", function(event) {
            that.hide();
        });
        document.addEventListener("keyup", function(event) {
            if (event.keyCode == 27) {
                that.hide();
            }
        });
     };
     Popup.prototype.toggle = function() {
         if (this.hidden) {
             this.show();
         }
         else {
            this.hide();
         }
     };
     Popup.prototype.show = function() {
         this.hidden = false;
         this.element.classList.remove("popup-hide");
         this.element.classList.add("popup-show");
         this.element.getElementsByClassName("post-content")[0].classList.add("scrollbox");
         document.body.classList.add("popup-open");
     };
     Popup.prototype.hide = function() {
         this.hidden = true;
         this.element.classList.remove("popup-show");
         this.element.classList.add("popup-hide");
         this.element.getElementsByClassName("post-content")[0].classList.remove("scrollbox");
         document.body.classList.remove("popup-open");
     };

     /**
      * Popup content.
      */
      var popups = document.getElementsByClassName("js-popup");
      var i;
      for (i = 0; i < popups.length; i++) {
          var popup = popups[i];
          if (!popup.dataset['js_popup']) {
            popup.dataset['js_popup'] = true;
            new Popup(popup);
          }
      }
})();