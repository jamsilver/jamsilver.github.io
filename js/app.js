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

})();