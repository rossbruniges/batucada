var batucada = window.batucada || {};

batucada.challenges = function() {
    var votes = $('#votes'),
        init = function() {
        if ($('#challenge_landing').length && votes.length) {
            // only got this far if the total submissions are greater than what are on display
            if (votes.find('li.submission').length >= votes.attr('data-total-votes')) {
                return false;
            }
            var moar = $('<div id="browse"><button>Show me more ideas</button><p>Those are all the ideas for this challenge - <a href="'+ window.location.href +'">Start again</a></p></div>').insertAfter(votes),
                num_entries = votes.attr('data-total-votes');
            // add in the exclude list
            votes.attr('data-excludes','');
            // click event for the moar button
            moar.find('button').bind('click', function(e) {
                votes.css('visibility','hidden');
                var excludes = votes.attr('data-excludes'),
                    tmp;
                    if (excludes != "") {
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
                                votes.html(tmp).attr("style", "");
                            }
                        });
                    }
                });
            });
        }
        if (votes.length) {
            votes.bind('click', function(e) {
                if ($(e.target).is('input.trigger')) {
                    var text_values= {
                            up: {
                                url_suffix:"upvote",
                                message:"What do you think?",
                                input_txt:"This is a great idea",
                                input_cls:"trigger vote"
                            },
                            clear:{
                                url_suffix:"clearvote",
                                message:"You liked this idea",
                                input_txt:"Cancel my vote",
                                input_cls:"trigger clear"
                            }
                        },
                        form = $(e.target).parents('form'),
                        action = form.attr('action'),
                        csrf = form.find('input[name="csrfmiddlewaretoken"]').attr('value'),
                        voting_html = form.parent();

                    $.ajax({
                        type:"POST",
                        dataType:"json",
                        url:action,
                        data:"csrfmiddlewaretoken=" + csrf + "",
                        success:function(data) {
                            if (data.score.score === 1) {
                                var obj = text_values.clear;
                            } else {
                                var obj = text_values.up;
                            }
                            voting_html.css('visibility','hidden');
                            voting_html.find('span.score').text(data.score.num_votes);
                            voting_html.find('input.trigger').attr('value',obj.input_txt).attr('className',obj.input_cls);
                            form.find('p').text(obj.message);
                            form.attr('action',action.replace(/[a-z]{6,9}$/,obj.url_suffix));
                            voting_html.css('visibility','');
                        }
                    });
                    return false;
                }
                if ($(e.target).is('a.more') && $('body').is('#challenge_landing')) {
                    var url = $(e.target).attr('href'),
                        parent = $(e.target).parents('li.submission'),
                        ajax_loader = $('#ajax_space'),
                        siblings = parent.siblings(),
                        num_siblings = siblings.length,
                        tmp = 0,
                        load_content;
                    load_content = function() {
                        if (!ajax_loader.length) {
                            ajax_loader = $('<div id="ajax_space" />').appendTo($('body'));
                        }
                        ajax_loader.load(url + ' div.ajax_copy', function() {
                            ajax_loader.appendTo(parent);
                            ajax_loader.append('<div class="meta"><p><a href="' + parent.find('a.more').attr('href')  + '">Add your comments to this idea and read about who submitted it</a></p><button>Close</button></div>');
                            ajax_loader.fadeIn('fast');
                        });

                    };
                    if (num_siblings !== 0) {
                        siblings.fadeOut('normal', function() {
                            tmp++;
                            if (tmp === num_siblings) {
                                load_content();
                            }
                        });
                    } else {
                        load_content();
                    }
                    return false;
                }
                if ($(e.target).is('button')) {
                    var parent = $(e.target).parents('li.submission');
                    $('#ajax_space').fadeOut('normal', function() {
                        parent.siblings().fadeIn('normal');
                     });
                }
            });

        }
    }
    return {
        init:init
    }
}();

$(function() {
    batucada.challenges.init();
});
