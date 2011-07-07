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

batucada.furnish = function(context) {
    var obj, context,  bd = batucada.data;
    // if no context is defined we know we're looking at the <body>
    if (!context) { 
        context = document.getElementsByTagName('body')[0];
    } else {
        context = document.getElementById(context);
    }
    obj = batucada.areas[context.id];
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
batucada.areas =  {
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
jQuery.fn.tabLinks = function(element) {
    var $modal = $(this).parents('.modal');
    $modal.addClass('tab-links');
    $(this).first().parent('li').addClass('active');
    
    var updateElement = function(e) {
        e.preventDefault();
        if($(e.target).closest('li').is('.active')) return;
        
        if ($(this).getOwnTab()) {
            $newTab = $(this).getOwnTab();
            $(element).replaceTab($newTab);
        } else {
            var href = $(this).attr('href');
            $('<div/>').load(href + ' ' + element, function() {
                $newTab = $(this).children().first();
                $(e.target).storeOwnTab($newTab);             
                $(element).replaceTab($newTab);
                $newTab.initForm();              
            });
        }
        $(this).parent('li').setActive();
    };
    $.fn.initForm = function() {
        $(this).attachDirtyOnChangeHandler();
        batucada.furnish($(this).attr('id'));
        return this;
    };
    var saveModal = function(e) {
        e.preventDefault();
        log('saveModal');
        
        $modal.find('.tabs .dirty a').each(function() {
            var tab = $(this).getOwnTab();
            if (tab) {
                var $forms = $(tab).find('form.dirty');
                $forms.each(function(){
                    $.ajax({
                        type: $(this).attr('method'),
                        url: $(this).attr('action'),
                        data: $(this).serialize(),
                        success: function(data) {
                            log(data);
                        }
                    });                    
                });
            }
        });
    };
    var closeModal = function(e) {
        e.preventDefault();
        log('closeModal');
    };
    // event handler fired when any modal input changes to mark that input as dirty
    // and fire a custom 'dirty' event to bubble up.
    var dirtyOnChange = function(e) {        
        $(e.target).addClass('dirty').trigger('dirty');
    };
    // event handler for cutome 'dirty' event
    var onInputDirty = function(e){
        if($(this).has(e.target).length > 0){
            $(this).addClass('dirty');
            if(e.data.tabLink){            
                e.data.tabLink.addClass('dirty');
            }                        
        }        
    };
    // input event handler for custom 'clean' event.
    var cleanInput = function(e){
        $(e.target).removeClass('dirty');
    };
    // event handler for custom 'clean' event
    var onInputClean = function(e){
        if(($(this).has(e.target).length > 0) && ($(this).has(':input.dirty').length == 0)){
            $(this).removeClass('dirty');
            if(e.data.tabLink){
                e.data.tabLink.removeClass('dirty');
            }
        }
    };
    // wire up the clean / dirty form element events and behaviours.
    $.fn.attachDirtyOnChangeHandler = function() {
        $tabLink =  $('li.' + $(this).attr('class').split(" ").join(", li."));
        $(this).find(':input')
            .bind('change', dirtyOnChange)
            .bind('clean', cleanInput)
            .end().find('form')
                .bind('dirty', {tabLink : $tabLink}, onInputDirty)
                .bind('clean', {tabLink : $tabLink}, onInputClean);
        return this;
    };
    $.fn.replaceTab = function($newTab) {
        this.parent().append($newTab).end().detach();
        return this;       
    };
    // onload activate the tab that corresponds to this tab group's sibling fieldset.
    $.fn.activateOnLoad = function() {
        if ( !this.is('a') ) return this;
        $tab = $modal.find('fieldset');
        $tabLink =  $('li.' + $tab.attr('class').split(" ").join(", li."));
        $tab.initForm();
        $tabLink
            .setActive()
            .find('a').storeOwnTab($tab);
        return this;
    };
    // deactivate all siblings, then activate the passed element
    $.fn.setActive = function() {
        this.siblings('li').each(function(i, e) {
            $(e).removeClass('active');
        });
        this.addClass('active');
        return this;
    };
    $.fn.storeOwnTab = function($tab) {
        if (!this.is('a')) return this;
        $(this).data('drumbeat.modal.tab', $tab);
        return this;
    };
    $.fn.getOwnTab = function() {
        if (!this.is('a')) return this; 
        return $(this).data('drumbeat.modal.tab');
    };
    $.fn.addButtons = function() {
        this.append(
            '<p class="ajax-buttons">'+
              '<a class="button close" href="#">Close</a>'+
              '<a class="button submit" href="#">Save</a>'+
            '</p>'
        ).find('a.close').bind('click', closeModal).parent().find('a.submit').bind('click', saveModal);
        return this;
    };
    // hook it up!
    $(this).each(function() {
        var me = $(this),
        href = me.attr('href');
        if (!href || href == '#')
            return;
        me.bind('click.tablinks', updateElement);
    }).activateOnLoad();
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
    // dispatch per-page onload handlers using batucada.furnish
    batucada.furnish();
    // attach handlers for elements that appear on most pages
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
    /* check for the existance of a video player and upload assets if needed */
    if ($('div.video-js-box').length) {
        // load in the CSS 
        var videoCSS = $('<link />').appendTo($('head'));
        videoCSS.attr({
            rel:'stylesheet',
            type:'text/css',
            href: batucada.data.MEDIA_URL + 'css/video-js.css?build=' + batucada.data.JS_BUILD_ID
        });
        // load in the JS file
        $.ajax({
            type:'GET',
            url: batucada.data.MEDIA_URL + 'js/include/video.js?build=' + batucada.data.JS_BUILD_ID,
            dataType:'script',
            success:function() {
                VideoJS.setupAllWhenReady();
            }
        });
    }
	/* wire up any RTEs with wmd
       not anymore we don't -  initWMD();
    */

    // modals using jQueryUI dialog
    $('.button.openmodal').live('click', function(){
        var url = this.href;
        var selector = '.modal';
        var urlFragment =  url + ' ' + selector;
        var dialog = $('<div></div>').appendTo('body');
        // load remote content
        dialog.load(
            urlFragment,
            function (responseText, textStatus, XMLHttpRequest) {
                dialog.dialog({
                    draggable: true
                });
            }
        );
        //prevent the browser to follow the link
        return false;
    });
    
    $('.modal nav.tabs a').tabLinks('.tabpane');
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

