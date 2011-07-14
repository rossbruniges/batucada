batucada.mojo_winners=function() {
    var init, load_box;
    load_box = function(context) {
        var boxCSS = $('<link />').appendTo($('head'));
        boxCSS.attr({
            rel:'stylesheet',
            type:'text/css',
            href:batucada.data.MEDIA_URL + 'css/jquery.fancybox-1.3.4.css?build=' + batucada.data.JS_BUILD_ID
        });
        $LAB.script(batucada.data.MEDIA_URL + 'js/include/jquery.fancybox-1.3.4.pack.js?build=' + batucada.data.JS_BUILD_ID)
        .wait(function() {
            context.find('a').fancybox({
                'height': '75%',
                'transitionIn' : 'none',
                'transitionOut' : 'none',
                'type' : 'iframe',
                'titlePosition' : 'inside',
                'titleFormat' : function(title, currentArray, currentIndex, currentOpts) {
                    return '<div id="fancybox-title-inside">Sketchnote ' +  (currentIndex + 1) + ' / ' + currentArray.length + '</div>';
                }
            });
        });
    };
    init = function() {
        var galleries;
        galleries = $('div.photos');
        galleries.each(function() {
            var current = $(this),
                parent = $(this).parent(),
                trigger;
            parent.addClass('gal');
            trigger = $('<button>Show gallery</button>').appendTo(parent);
            trigger.click(function() {
                current.slideDown(function() {
                    trigger.remove();
                    parent.removeClass('gal');
                    load_box(current);
                });
            });
        });
    }
    return {
        'init':init
    }
}();
