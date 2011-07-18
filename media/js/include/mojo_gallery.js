/**
 * @namespace
 * @requires jQuery, LABS.js, batucada.areas
 * @returns batucada.mojo_challengs.init()
 */
batucada.mojo_winners=function() {
    var init, load_box;
    /**
     * Private function to load/set up colorbox plugin
     * http://colorpowered.com/colorbox/
     *
     * @param context {jQuery object}
     */
    load_box = function(context) {
        var boxCSS, attr_id, selector, attrs, tmp, num;
        attr_id = context.attr('id');
        // grabbing all lightbox links 
        selector = '#' + attr_id + ' a[rel="note_group"]';
        attrs = {
            width:'80%',
            height:'80%',
            scrolling:true,
            title:'Idea sketchnote(s)',
            scalePhotos:false,
            rel:attr_id
        };
        tmp = $(selector);
        num = tmp.length - 1;
        // custom event to ensure that the page is ready once called
        context.bind('all_changed', function() {
            // Loading in colourbox when asked for
            if ($.colorbox === undefined) {
                boxCSS= $('<link />').appendTo($('head'));
                boxCSS.attr({
                    rel:'stylesheet',
                    type:'text/css',
                    href:batucada.data.MEDIA_URL + 'css/colorbox.css?build=' + batucada.data.JS_BUILD_ID
                });
                $LAB.script(batucada.data.MEDIA_URL + 'js/include/jquery.colorbox.min.js?build=' + batucada.data.JS_BUILD_ID)
                .wait(function() {
                    $('a[rel=' + attr_id  + ']').colorbox(attrs);
                });
                // but only the once!
            } else {
                $('a[rel=' + attr_id + ']').colorbox(attrs);
            }
        })
        /*
         * This is rather hacky but the plugin deals with context awfully
         * This allows us to set up a gallery of the photos we need, opposed to ALL photos
         */
        tmp.each(function (index) {
            $(this).attr('rel',attr_id);
            if (index === num) {
                context.trigger('all_changed');
            }
        });
    }
    /**
     * Public function to set up page functionality
     */
    init = function() {
        var galleries, len;
        galleries = $('div.photos');
        len = galleries.length - 1;
        galleries.each(function(index) {
            var current = $(this),
                parent = $(this).parent(),
                trigger;
            current.attr('id', 'group_' + index);
            parent.addClass('gal');
            trigger = $('<button>Show gallery</button>').appendTo(parent);
            trigger.click(function() {
                current.slideDown(function() {
                    // removing trigger as we won't need it now
                    trigger.remove();
                    load_box(current);
                });
            });
            if (len === index) {
                // sets visibility:visible on all nodes
                $('html').addClass('photos_init');
            }
        });
    }
    return {
        'init':init
    }
}();
