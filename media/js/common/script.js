/*!
    Set of misc scripts inherited from initial drumbeat.org site
*/
var createPostTextArea = function() {
    $('#create-post').find('textarea').bind('keyup', function() {
        var max = 750;
        var counter = $('#create-post').find('div.post-char-count');
        var count = max - $(this).val().length;
        counter.html(count);

        if (count < 0) {
            counter.addClass('danger');
            counter.removeClass('warning');
        }
        else if (count < 50) {
            counter.removeClass('danger');
            counter.addClass('warning');
        }
        else {
            counter.removeClass('danger');
            counter.removeClass('warning');
        }
    });

    $('#create-post').find('textarea').bind('blur', function() {
        if (jQuery.trim($(this).val()).length === 0) {
            $('#create-post').removeClass('expanded');
        }
    });

    $('#create-post').find('input').bind('focus', function() {
        $('#create-post').addClass('expanded');
        $('#create-post').find('textarea').trigger('focus');
    });
};

var usernameHint = function() {
    var userurl = $('#username .hint b').html();
    $('#id_username').keyup(function() {
        $('#availability').removeClass('okay warning').html('');
        var val = (this.value) ? this.value : userurl;
        $(this).parent('.field').find('.hint b').html(val);
    }).keyup();
};

var usernameAvailability = function() {
    $('#id_username').bind('blur', function() {
        var $elem = $(this);
        if ($elem.val().length != 0) {
            $.ajax({
                url: '/ajax/check_username/',
                data: {
                    username: this.value
                },
                success: function() {
                    $('#availability').removeClass('okay')
                        .addClass('warning')
                        .html('not available');
                },
                error: function() {
                    $('#availability').removeClass('warning')
                        .addClass('okay')
                        .html('available');
                }
            });
        }
    });
};

var openidHandlers = function() {
    var oneClick = {
        'google': 'https://www.google.com/accounts/o8/id',
        'yahoo': 'https://yahoo.com',
        'myopenid': 'https://www.myopenid.com'
    };
    $.each(oneClick, function(key, value) {
        $('.openid_providers #' + key).bind('click', function(e) {
            e.preventDefault();
            $('#id_openid_identifier').val(value);
            $('#id_openid_identifier').parent().submit();
        });
    });
};

var loadMoreMessages = function() {
    $('a#inbox_more').bind('click', function(e) {
        e.preventDefault();
        var template = $('#message-template');
        var page = template.attr('page');
        var npages = template.attr('npages');
        var url = $(this).attr('href');
        $.getJSON(url, function(data) {
            $(data).each(function(i, value) {
                var msg = template.tmpl(value);
                msg.hide();
                $('#posts').append(msg);
                $('li.post-container:last').fadeIn(function() {
                    $('html').animate({
                        'scrollTop': $('a#inbox_more').offset().top
                    }, 200);
                });
            });
            nextPage = parseInt(page) + 1;
            template.attr('page', nextPage);
            if (nextPage > parseInt(npages)) {
                $('a#inbox_more').hide();
            }
            // update more link. very hacky :( 
            var href = $('a#inbox_more').attr('href');
            var newHref = href.substr(0, href.length - 2) + nextPage + '/';
            $('a#inbox_more').attr('href', newHref);
        });
    });
};

var attachFileUploadHandler = function($inputs) {
    var updatePicturePreview = function(path) {
        var $img = $('<img class="member-picture"></img>');
        $img.attr('src', path);
        $('p.picture-preview img').remove();
        $img.appendTo('p.picture-preview');
    },
    bd = batucada.data;
    $(this).closest('form').removeAttr('enctype');
    $inputs.closest('fieldset').addClass('ajax-upload');
    $inputs.each(function() {
        $(this).ajaxSubmitInput({
            url: $(this).closest('form').attr('data-url'),
            beforeSubmit: function($input) {
                updatePicturePreview(bd.MEDIA_URL + "images/ajax-loader.gif");
                $options = {};
                $options.filename = $input.val().split(/[\/\\]/).pop();
                return $options;
            },
            onComplete: function($input, iframeContent, passJSON) {
                $input.closest('form')[0].reset();
                $input.trigger('clean');
                if (!iframeContent) {
                    return;
                }
                var content = jQuery.parseJSON(iframeContent);
                updatePicturePreview(bd.MEDIA_URL + content.filename);
            }
        });
    });
};
/**
 * @namespace Functions used to set up an app page
 * @requires jQuery, LAB.js, batucada.areas, batucada.data (set in template)
 * @returns {Object} two helper methods - prepare() and furnish()
 */
batucada.page = function() {
    var prepare, furnish;
    /**
     * Public function to load dependacies and run fucntions for a specific page
     *
     * @param context {String} either an ID to search for or a CSS selector for jQuery to find
     * @param o {Object} batucada.page.furnish compatible object
     * @example
     * batucada.page.furnish()
     * @example
     * batucada.page.furnish ('myID', {
     *   elm : 'mySelector',
     *   requires : ['js/files/to/load'] (optional),
     *   text : 'location of a JS file containing a localised JS text object (optional)
     *   onload : function() {
     *     console.log('called once the contents of required is loaded');
     *    }
     * });
     */
    furnish = function(context,o) {
        var obj, context,  bd = batucada.data;
        // if no context is defined we know we're looking at the <body>
        if (!context) { 
            context = document.getElementsByTagName('body')[0];
        } else {
            // checks for a matching ID and falls back to jQuery for non-matches
            context = document.getElementById(context) || $(context);
        }
        // if we sent an object use that otherwise use the one in batucada.areas
        obj = o || batucada.areas[context.id];
        if (obj) {
            // cache these objects for later re-use
            var req = obj.requires,
                txt = obj.text;
            // set up a custom event that can be called once the locale has been loaded and avoid race-condition
            $(context).bind('locale_loaded', function() {
                // load in the required file and once done call the onload to init it
                if (req && req.length) {
                    $LAB
                    .script(bd.MEDIA_URL + req[0] + '?build=' + bd.JS_BUILD_ID)
                    .wait(function() {
                        obj.onload();
                    });
                } else {
                    if (typeof obj.onload === 'function') {
                        obj.onload();
                    }
                }
            });
            // load the require localised string file
            if (txt && txt.length) {
                // cascade from a potential local to the default if we get an error
                $.ajax({
                    dataType:'script',
                    url: bd.MEDIA_URL + 'js/l10n/en-US/' + txt[0],
                    success:function() {
                        $(context).trigger('locale_loaded');
                    },
                    error:function(data) {
                        $.ajax({
                            url: bd.MEDIA_URL + 'js/l10n/' + txt[0],
                            dataType: 'script',
                            success:function() {
                                 $(context).trigger('locale_loaded');
                            }
                        });
                    }
                });
            } else {
                $(context).trigger('locale_loaded'); 
            } 
        }
    };
    /**
     * Public function used to load dependancies and call init functions
     * for common site or UGC code
     *
     * If you want a site wide piece of code to run include it in here
     *
     * @memberOf batucada.page
     */
    prepare = function() {
        var common, len;
        /**
         * Array containing batucada.page.furnish objects
         * - elm: DOM element: if this exists the code is run
         * - requires: link to a JS file dependancy
         * - onload: function called once dependancy is loaded
         */
        common= [
        {
            elm :'.modal nav.tabs',
            requires : ['js/include/admin_tabs.js'],
            onload: function() {
                $('.modal nav.tabs a').tabLinks('.tabpane');
            }
        },
        {
            // video player - loads the CSS and JS
            elm : 'div.video-js-box',
            requires : ['js/include/video.js'],
            onload: function() {
                var videoCSS = $('<link />').appendTo($('head'));
                videoCSS.attr({
                    rel:'stylesheet',
                    type:'text/css',
                    href: batucada.data.MEDIA_URL + 'css/video-js.css?build=' + batucada.data.JS_BUILD_ID
                });
                VideoJS.setupAllWhenReady();
            }
        },
        {
            // user-navigation dropdowns
            elm : '#user-nav',
            onload: function() {
                $('#user-nav').find('a.trigger').bind('click', function(event) {
		            var target = $(this).parent();
		            // close any previously open tab
		            target.parent().find('li.open').removeClass('open');
                    target.toggleClass('open');
		            // return false to ensure that we don't get '#' appear in the URL
		            return false;
                }).end().find('li.menu')
                .bind('mouseenter', function() {
                    if ($(this).is('.open')) {
                        window.clearTimeout(batucada.fader);
                    }
                })
                .bind('mouseleave', function() {
                    if ($(this).is('.open')) {
                        var current = $(this);
                        batucada.fader = window.setTimeout(function() {
                            current.removeClass('open');
                            current.find('ul').fadeOut('fast', function() {
                                $(this).attr('style', '');
                            });
                        }, 1000);
                    }        
                });
            }
        }
        ];
        // i will be 0 indexed
        len = common.length - 1;
        /**
         * i: the current iteration
         * v: each object in common (above)
         */
        $.each(common, function(i, v) {
            var e = v.elm;
            if ($(e).length) {
                // call furnish with the current DOM reference and object
                furnish(e,v);
            }
            // once we've made it through all common objects call furnish on the page
            if (i === len) {
                furnish();
            }
        });
    }
    return {
        prepare : prepare,
        furnish : furnish
    }

}();

batucada.areas =  {
    mojo_challenges: {
        requires:['js/include/mojo_gallery.js'],
        onload:function() {
            batucada.mojo_winners.init()
        }
    },
    compose_message: {
        onload: function() {
            $('#id_recipient').autocomplete({
                source: '/ajax/following/',
                minLength: 2
            });
        }
    },
    create_profile: {
        onload: function() {
            usernameHint();
            usernameAvailability();
        }
    },
    signup: {
        onload: function(){
            usernameHint();
            usernameAvailability();
        }
    },
    signup_openid: {
        onload: function() {
            openidHandlers();
        }
    },
    signin_openid: {
        onload: function() {
            openidHandlers();
        }
    },
    dashboard: {
        onload: function() {
            createPostTextArea();
            $('#post-update').bind('click', function() {
                $('#post-status-update').submit();
            });
            $('a.activity-delete').bind('click', function(e) {
                $(e.target).parent().submit();
                return false;
            });
            $('.close_button').bind('click', function(e) {
                e.preventDefault();
                $('.welcome').animate({
                    opacity: 'hide',
                    height: 'hide',
                    paddingTop: 0,
                    paddingBottom: 0,
                    marginTop: 0,
                    marginBottom: 0
                }, 600, 'jswing', function() {
                    $.post('/broadcasts/hide_welcome/');
                });
            });
        }
    },
    project_landing: {
        onload: function() {
            createPostTextArea();
            $('#post-project-update').bind('click', function() {
                $('#post-project-status-update').submit();
            });
        }
    },
    project_edit_description : {
        requires: ['js/include/jquery.wmd.js'],
        onload: function() {
            initWMD();
        }
    },
    challenge_landing: {
        onload: function() {
            createPostTextArea();
            $('#post-challenge').bind('click', function() {
                $('#post-challenge-summary').submit();
            });
        }
    },
    user_profile: {
        onload: function() {
            createPostTextArea();
            $('#post-user-update').bind('click', function() {
                $('#post-user-status-update').submit();
            });
        }
    },
    profile_edit_image: {
        requires: ['js/include/jquery.ajaxupload.js'],
        onload: function() {
            attachFileUploadHandler($('input[type=file]'));
        }
    },
    inbox: {
        requires: ['js/include/jquery.tmpl.min.js'],
        onload: function() {
            loadMoreMessages();
        }
    },
    all_submissions : {
        text:['challenges.js'],
        requires: ['js/include/challenges.js'],
        onload: function() {
            batucada.challenges.init(); 
        }
    },
    submission_show : {
        text:['challenges.js'],
        requires: ['js/include/challenges.js'],
        onload: function() {
            batucada.challenges.init();
        }
    },
    voting_landing : {
        text:['challenges.js'],
        requires: ['js/include/challenges.js'],
        onload: function() {
            batucada.challenges.init();
        }
    },
    mojo_process: {
        requires: ['js/include/jquery.bt.min.js'],
        onload: function() {
            var run_bt = function() {
                $('.js-tooltip').bt({
                    hideTip: function(box, callback){
                        $(box).animate({
                            marginTop: "-10px",
                            opacity: 0
                        }, 250, callback );
                    },
                    closeWhenOthersOpen : true,
                    contentSelector: "$(this).next()",
                    trigger: 'click',
                    fill: '#fff7df',
                    strokeStyle: '#ffe69a',
                    padding: '10px 10px 0 10px',
                    width: 400,
                    cornerRadius: 5,
                    strokeWidth: 1,
                    spikeGirth: 15,
                    spikeLength: 9,
                    shadow: true,
                    shadowOffsetX: 2,
                    shadowOffsetY: 2,
                    shadowBlur: 5,
                    shadowColor: 'rgba(0,0,0,.15)',
                    shadowOverlap: false,
                    noShadowOpts: {
                        strokeStyle: '#ffe69a', 
                        strokeWidth: 1
                    },
                    positions: ['top', 'bottom']
                });
            };
            if ($('html.canvas').length) {
                run_bt();
            } else {
                $LAB.script(batucada.data.MEDIA_URL + 'js/include/excanvas.js').
                wait(function() {
                    run_bt();
                });
            }
        }
    }
};

var initWMD = function(){
    var area = $('textarea.wmd');
    if (area.siblings('.wmd-button-bar').length === 0) {
        area.wmd({
            'preview': false,
            'helpLink': '/editing-help/'
        });
    }
};

$(document).ready(function() {
    batucada.page.prepare();
});

// Recaptcha
var RecaptchaOptions = { theme : 'custom' };

$('#recaptcha_different').click(function(e) {
    e.preventDefault();
    Recaptcha.reload();
});

$('#recaptcha_audio').click(function(e) {
    e.preventDefault();
    Recaptcha.switch_type('audio');
});

$('#recaptcha_help').click(function(e) {
    e.preventDefault();
    Recaptcha.showhelp();
});
