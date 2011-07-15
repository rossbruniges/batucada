batucada.mojo_winners=function() {
    var init, load_box;
    load_box = function(context) {
        var boxCSS, attr_id, selector, attrs, tmp, num;
        attr_id = context.attr('id');
        selector = '#' + attr_id + ' a[rel="note_group"]';
        attrs = {
            width:'80%',
            height:'80%',
            scrolling:true,
            scalePhotos:false,
            rel:attr_id
        };
        tmp = $(selector);
        num = tmp.length - 1;
        context.bind('all_changed', function() {
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
            } else {
                $('a[rel=' + attr_id + ']').colorbox(attrs);
            }
        })
        tmp.each(function (index) {
            $(this).attr('rel',attr_id);
            if (index === num) {
                context.trigger('all_changed');
            }
        });
    }
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
                    trigger.remove();
                    load_box(current);
                });
            });
            if (len === index) {
                $('html').addClass('photos_init');
            }
        });
    }
    return {
        'init':init
    }
}();
