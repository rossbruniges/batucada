var batucada = window.batucada || {};

batucada.challenges = function() {
    var votes = $('#votes'), body_id = $('body').attr('id'), init, randomizr, vote_up, load_ideas, expandr;
    load_ideas = {
        load_content : function(url, dest) {
            var ajax_loader = $('#ajax_space'),
                timer;
            if (!ajax_loader.length) {
                ajax_loader = $('<div id="ajax_space" />').appendTo($('body'));
            }
            timer = window.setTimeout(function() {
                 ajax_loader.append('<p class="feedback">Loading content</p>');
            },500);
            ajax_loader.appendTo(dest);
            dest.addClass('expanded');
            ajax_loader.load(url + ' div.ajax_copy', function() {
                clearTimeout(timer);
                // ajax_loader.appendTo(dest);
                ajax_loader.append('<div class="meta"><p><a href="' + dest.find('a.more').attr('href')  + '">Add your comments to this idea and read about who submitted it</a></p><button>Close</button></div>');
                ajax_loader.fadeIn('fast', function() {
                   // dest.addClass('expanded')
                });
            });
        },
        pull : function(target) {
            var url, parent, sibs, num_sibs, tmp;
            url = target.attr('href');
            parent = target.parents('li.submission');
            sibs = parent.siblings();
            num_sibs = sibs.length;
            tmp = 0;
            if (num_sibs !== 0) {
                sibs.each(function() {
                    $(this).fadeOut('normal', function() {
                        tmp++;
                        if (tmp === num_sibs) {
                            load_ideas.load_content(url,parent);
                        }
                    });
                });
            } else {
                load_ideas.load_content(url,parent);
            }
        }
    };
    vote_up =  {
        text_values : {
            up: {
                url_suffix:"upvote",
                input_txt:"Vote",
                input_cls:"trigger vote"
            },
            clear:{
                url_suffix:"clearvote",
                input_txt:"Clear",
                input_cls:"trigger clear"
            }
        },
        vote : function(target) {
            var form, action, csrf, voting_html, obj;
            form = target.parents('form');
            action = form.attr('action');
            csrf = form.find('input[name="csrfmiddlewaretoken"]').attr('value');
            voting_html = form.parent();
            voting_html.find('span.score').html('<img src="/media/images/ajax-loader.gif" height="16" width="16" />');
            $.ajax({
                type:"POST",
                dataType:"json",
                url:action,
                data:"csrfmiddlewaretoken=" + csrf,
                success:function(data) {
                    if (target.is('.vote')) {
                        obj = vote_up.text_values.clear;
                    } else {
                        obj = vote_up.text_values.up;
                    }
                    voting_html.css('visibility','hidden');
                    voting_html.find('span.score').html(data.score.num_votes);
                    voting_html.find('input.trigger').attr({
                        'value' : obj.input_txt,
                        'class' : obj.input_cls
                    });
                    form.attr('action',action.replace(/[a-z]{6,9}$/,obj.url_suffix));
                    voting_html.css('visibility','');
                }
            });
        }
    };
    randomizr = function() {
        var moar, num_entries, loader, messages; 
        moar =  $('<div id="browse"><button>Show me more ideas</button><p>Those are all the ideas for this challenge - <a href="'+ window.location.href +'">Start again</a></p></div>').insertAfter(votes);
        messages = {
            'loading':'Loading in more ideas',
            'error':'Hmm, something has gone wrong. Give it another go...'
        };
        loader = $('<div id="loader"><p>' + messages.loading + '</p></div>').insertBefore(votes).css({
            'height':votes.height() + 'px',
            'position':'absolute'
        });
        num_entries = votes.attr('data-total-votes');
        // add in the exclude list
        votes.attr('data-excludes','');
        // click event for the moar button
        moar.find('button').bind('click', function() {
            var timer, excludes, tmp;
            votes.css('visibility','hidden');
            // only show this if there is an actual wait
            timer = setTimeout(function() {
                loader.css('display','block');
            }, 500);
            excludes = votes.attr('data-excludes');
            if (excludes !== "") {
                tmp = excludes.split(",");
            } else {
                tmp = [];
            }
            votes.find('div.post-contents').each(function(i) {
                tmp.push($(this).attr('data-unique'));
                if (i === 3) {
                    excludes = tmp.join(",");
                    votes.attr('data-excludes',excludes);
                    $.ajax({
                        url:window.location.pathname + "voting/get_more/?count=4&exclude=" + excludes,
                        type:"GET",
                        dataType:"json",
                        success:function(data) {
                            var tmp = "";
                            $.each(data.submissions, function(i) {
                                tmp += "<li class='submission'>" + data.submissions[i] + "</li>";
                            });
                            if (data.submissions.length < 4) {
                                moar.addClass('restart');
                            }
                            window.clearTimeout(timer);
                            loader.css('display','none');
                            votes.css("visibility", "visible").html(tmp);
                        }
                    });
                }
            });
        });
    };
    expandr = function () {
        var elm = $('div.expando'),
            txt = {
                open:"Close summary",
                closed:"Read challenge summary"
            },
            trigger = $('<a id="expandr" href="#">' + txt.closed + '</a>').insertAfter(elm);
        trigger.bind('click', function() {
            var el = $(this);
            el.css('display','none');
            if (el.is('.open')) {
                 elm.slideUp('normal', function() {
                    el.text(txt.closed);
                    el.attr({
                        'class':'closed',
                        'style':''
                    });
                });
            } else {
                elm.slideDown('normal', function() {
                    el.text(txt.open);
                    el.attr({
                        'class':'open',
                        'style':''
                    });
                });
            }
            return false;
        });
    };
    init = function() {
        if (votes.length) {
            if (body_id === "voting_landing") {
                if (votes.find('li.submission').length <= votes.attr('data-total-votes')) {
                    randomizr();
                }
                if ($('div.expando').length) {
                    expandr();
                }
            }
            votes.bind('click', function(e) {
                var elm = $(e.target);
                if (elm.is('input.trigger')) {
                    vote_up.vote(elm);
                    return false;
                }
                if (elm.is('a.more') && $('body').is('#voting_landing')) {
                    load_ideas.pull(elm);
                    return false;
                }
                if (elm.is('button')) {
                    var parent = elm.parents('li.submission');
                    $('#ajax_space').fadeOut('normal', function() {
                        parent.removeClass('expanded');
                        parent.siblings().fadeIn('normal');
                        $(this).attr('style','').html('');
                     });
                }
            });

        }
    };
    return {
        init:init
    };
}();

$(function() {
    batucada.challenges.init();
});
