"use strict";
if (!window.jhs_included) {
window.jhs_included = true;
(function() {

    /**
     * AnimationManager.
     *
     * Our own poor man's animation handler.
     */
    class AnimationHandler {
        constructor(name) {
            this.name = name;
            this.phases = [
                {
                    t: 0.3,
                    c: "stage1",
                    d: 300
                },
                {
                    t: 0.4,
                    c: "stage2",
                    d: 300
                },
                {
                    t: 0.5,
                    c: "stage3",
                    d: 300
                },
                {
                    t: 0.6,
                    c: "stage4",
                    d: 300
                }
            ];
            this.t = -1;
            this.lastTransitionTime = null;
            this.queue = [];
        }
        updateTime(t) {
            if (t !== this.t) {
                var active_phase = this.getActivePhase();
                var accrue_phases = false;
                var reverse = t < this.t;
                this.queue = [];
                this.forEachPhase(reverse, function(phase) {
                    if (accrue_phases || !active_phase) {
                        if ((reverse && phase.t >= t) || (!reverse && phase.t <= t)) {
                            this.queue.push(phase);
                        }
                    }
                    if (phase === active_phase || !active_phase) {
                        accrue_phases = true;
                    }
                });
                this.t = t;
            }
            this.tick();
        }
        tick() {
            if (this.queue.length > 0) {
                var time_now = performance.now();
                // Move to the next phase after waiting long enough to allow
                // the CSS transition.
                if (!this.activePhaseEquals(this.queue[0]) && (!this.lastTransitionTime || (time_now - this.lastTransitionTime >= this.getActivePhase().d))) {
                    this.setActivePhase(this.queue[0]);
                    this.lastTransitionTime = time_now;
                    this.queue.shift();
                }
                // Still more to do, queue up another tick.
                if (this.queue.length > 0) {
                    requestAnimationFrame(this.tick.bind(this));
                }
            }
        }
        setActivePhase(phase) {
            document.documentElement.dataset[this.name] = phase.c;
            return this;
        }
        activePhaseEquals(phase) {
            var active_phase_c = document.documentElement.dataset[this.name] || this.phases[0].c;
            return active_phase_c === phase.c;
        }
        getActivePhase() {
            if (document.documentElement.dataset[this.name]) {
                return this.getPhaseByName(document.documentElement.dataset[this.name]);
            }
            else {
                return this.phases[0];
            }
        }
        getPhaseByName(name) {
            var phase;
            this.forEachPhase(false, function(p) {
                if (p.c === name) {
                    phase = p;
                }
            });
            return phase;
        }
        forEachPhase(reverse, cb) {
            var i;
            if (reverse) {
                for (i = this.phases.length - 1; i >= 0; i--) {
                    cb.call(this, this.phases[i]);
                }
            }
            else {
                for (i = 0; i < this.phases.length; i++) {
                    cb.call(this, this.phases[i]);
                }
            }
        }
    }

    /**
     * PageManager.
     *
     * Handles stuff to do with pages. Including:
     *
     *   - Switching the active page,
     *   - Switching the active nav item,
     *   - Updating body classes based on scroll position.
     */

    // Helper class for tracking the set of active elements.
    class ActiveElementsRecord {
        id = null;
        toggle_id = null;
        page = null;
        anchor = null;
        toggle = null;
        element = null;

        constructor(id) {
            if (id && id.length > 0) {
                this.id = id;
            }
        }

        static constructFromDOMAndHash(pm) {
            var active = new ActiveElementsRecord();
            pm.eachPage(function(page) {
                if (!page.hasAttribute("hidden")) {
                    active.page = page;
                    if (active.page.dataset.toggle) {
                        active.toggle = document.getElementById(active.page.dataset.toggle);
                    }
                }
            });
            var hash_bits = ActiveElementsRecord.parseHash();
            if (hash_bits[0]) {
                var active_element = document.getElementById(hash_bits[0]);
                if (active_element) {
                    active.page = active_element.closest("main");
                    if (active.page.dataset.toggle) {
                        active.toggle = document.getElementById(active.page.dataset.toggle);
                    }
                    if (active_element !== active.page) {
                        active.element = active_element;
                    }
                }
            }
            if (hash_bits[1]) {
                var active_toggle = document.getElementById(hash_bits[1]);
                if (active_toggle) {
                    active.toggle = active_toggle;
                }
            }
            return active;
        }

        static parseHash() {
            var page_id, toggle_id;
            if (window.location.hash) {
                var hash = window.location.hash.substring(1);
                if (hash.indexOf("$") !== -1 && hash.split("$").length === 2) {
                    var bits = hash.split("$");
                    page_id = bits[0];
                    toggle_id = bits[1];
                }
                else {
                    page_id = hash;
                }
            }
            return [page_id, toggle_id];
        }

        populateProperties(pm) {
            var that = this;
            if (this.id && !this.page) {
                this.page = document.getElementById(this.id);
            }
            if (this.page && !this.id) {
                this.id = this.page.id;
            }
            if (this.toggle_id && !this.toggle) {
                this.toggle = document.getElementById(this.toggle_id);
            }
            if (this.toggle && !this.toggle_id) {
                this.toggle_id = this.toggle.id;
            }
            if (this.id && !this.anchor) {
                pm.eachNav(function(n) {
                    if (n.hash.substring(1) === that.id) {
                        that.anchor = n;
                    }
                }, false);
            }
        }

        getHash() {
            var hash = "";
            if (this.element) {
                hash += this.element.id;
            }
            else if (this.id) {
                hash += this.id;
            }
            if (this.toggle_id) {
                hash += "$" + this.toggle_id;
            }
            return hash;
        }
    }
    const PageManager = function() {
        this.pages = document.getElementsByTagName("main");
        this.navs = document.getElementsByClassName("js-main-nav");
        this.active = new ActiveElementsRecord();
        this.headerAnimation = new AnimationHandler("headerState");
    };

    PageManager.prototype.init = function() {
        this.active = ActiveElementsRecord.constructFromDOMAndHash(this);
        this.applyActive();
        var that = this;
        // Event to handle nav taps.
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains("js-main-nav") && !event.target.hasAttribute("disabled") && !event.jhs_shtap) {
                // May be a <a href="#id" /> or a nested <input type="checkbox" />.
                // We don't care which was clicked.
                var active_anchor, active_checkbox, active_checkbox_checked, active_id;
                switch (event.target.tagName) {
                    case "A":
                        active_anchor = event.target;
                        var checkbox = active_anchor.getElementsByTagName("input");
                        if (checkbox && checkbox[0]) {
                            active_checkbox = checkbox[0];
                            // If the nav item was already active, count the tap as a deliberate toggle
                            // of the nested checkbox.
                            if ((active_anchor.getAttribute("aria-current") === "page") && active_checkbox) {
                                active_checkbox.checked = !active_checkbox.checked;
                            }
                            active_checkbox_checked = active_checkbox.checked;
                        }
                        break;
                    case "INPUT":
                        active_anchor = event.target.closest("a");
                        active_checkbox = event.target;
                        active_checkbox_checked = active_checkbox.checked;
                        // If the nav item was moved to for the first time, count the tap as a change
                        // of page only. Cancel the toggle of the nested checkbox.
                        if (!(active_anchor.getAttribute("aria-current") === "page")) {
                            active_checkbox_checked = !active_checkbox.checked;
                            event.preventDefault();
                        }
                        break;
                }
                // Set active page.
                active_id = active_anchor.hash.substring(1);
                that.active = new ActiveElementsRecord(active_id);
                if (active_checkbox_checked) {
                    that.active.toggle = active_checkbox;
                }
                that.applyActive();
                // In local dev webpack includes this file twice so this runs twice
                // and confuses things. This is a quick fix.
                event.jhs_shtap = true;
            }
        });
    };

    PageManager.prototype.applyActiveByID = function(id) {
        this.active = new ActiveElementsRecord(id);
        this.applyActive();
        return this;
    };

    PageManager.prototype.applyActive = function() {
        this.active.populateProperties(this);
        // Show correct page and toggle class.
        this.eachPage((p) => {
            if (p !== this.active.page && !p.hasAttribute("hidden")) {
                p.setAttribute("hidden", "");
            }
            if (p === this.active.page && p.hasAttribute("hidden")) {
                p.removeAttribute("hidden");
            }
            if (p.dataset.toggle && (p !== this.active.page || p.dataset.toggle !== this.active.toggle_id)) {
                p.classList.remove(p.dataset.toggle);
                delete p.dataset.toggle;
            }
            if (p === this.active.page && this.active.toggle_id && (!p.dataset.toggle || p.dataset.toggle !== this.active.toggle_id)) {
                p.dataset.toggle = this.active.toggle_id;
                p.classList.add(p.dataset.toggle);
            }
        });
        // Mark correct anchor as active.
        this.eachNav((n) => {
            if (this.active.anchor && n === this.active.anchor) {
                n.setAttribute("aria-current", "page");
                // Ensure the nested checkbox is in the correct state.
                var checkbox = this.active.anchor.getElementsByTagName("INPUT");
                if (checkbox && checkbox[0]) {
                    checkbox[0].checked = this.active.toggle && (checkbox[0] === this.active.toggle);
                }
            }
            else {
                n.removeAttribute("aria-current");
            }
        }, false);
        // Allow some pages to opt into a minimized header.
        if ("miniHeader" in this.active.page.dataset) {
            this.headerAnimation.updateTime(1);
        }
        else {
            this.headerAnimation.updateTime(0);
        }
        this.updateHash(true);
        this.setDocAttributes();
        return this;
    };

    PageManager.prototype.updateHash = function(and_scroll) {
        // Set window hash and scroll to active element.
        // If the click was on the link, then the browser sets
        // the hash just after our code runs, and ruins this line if
        // it corresponded to our checkbox instead.
        // Pop it next in the event queue to get around this.
        var that = this;
        setTimeout(() => {
            window.location.hash = "#" + that.active.getHash();
            if (that.active.element && and_scroll) {
                that.active.element.scrollIntoView();
            }
        }, 100);
    }

    PageManager.prototype.setDocAttributes = function() {
        if (!this.active.id && document.documentElement.dataset.activePage) {
            delete document.documentElement.dataset.activePage;
        }
        if (this.active.id && document.documentElement.dataset.activePage !== this.active.id) {
            document.documentElement.dataset.activePage = this.active.id;
        }
        if (!this.active.toggle_id && document.documentElement.dataset.activeToggle) {
            delete document.documentElement.dataset.activeToggle;
        }
        if (this.active.toggle_id && document.documentElement.dataset.activeToggle !== this.active.toggle_id) {
            document.documentElement.dataset.activeToggle = this.active.toggle_id;
        }
    };

    PageManager.prototype.eachPage = function(cb) {
        var i;
        for (i = 0; i < this.pages.length; i++) {
            cb.call(this, this.pages[i]);
        }
    };

    PageManager.prototype.eachNav = function(cb, include_checkboxes) {
        var i;
        for (i = 0; i < this.navs.length; i++) {
            if (include_checkboxes || (this.navs[i].tagName !== "INPUT")) {
                cb.call(this, this.navs[i]);
            }
        }
    };

    var pages = new PageManager();
    pages.init();

    // Switch to Journey page if Konami code.
    /*! konami-js v1.0.1 | http://mck.me/mit-license */
    var Konami={};(function(d,e){var f=d.sequence=function(){var b=Array.prototype.slice.call(arguments),c=0;return function(a){a=a||e.event;a=a.keyCode||a.which||a;if(a===b[c]||a===b[c=0])a=b[++c],"function"===typeof a&&(a(),c=0)}};d.code=function(b){return f(38,38,40,40,37,39,37,39,66,65,b)}})(Konami,window);
    document.addEventListener(
        "keyup",
        Konami.code(function() {
            pages.applyActiveByID("journey");
        })
    );

    // Add the right "$more" onto the URL if the user clicks a secondary article.
    var anchors = document.getElementsByClassName("anchor");
    var i;
    for (i = 0; i < anchors.length; i++) {
        (function (anchor) {
            anchor.addEventListener("click", function(event) {
                pages.active.element = anchor;
                pages.active.toggle_id = anchor.dataset.toggle;
                pages.updateHash(false);
            });
        })(anchors[i]);
    };


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
})();
}