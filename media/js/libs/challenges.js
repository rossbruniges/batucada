var batucada = window.batucada || {};

batucada.challenges = function() {
    var init = function() {
        if ($('li.submission').length) {
            $('#posts').bind('click', function(e) {
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
                        },form = $(e.target).parents('form'),
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
                if ($(e.target).is('a.more')) {
                    var url = $(e.target).attr('href'),
                        parent = $(e.target).parents('li.submission'),
                        ajax_loader = $('#ajax_space');
                    parent.siblings().fadeOut('normal');
                    if (!ajax_loader.length) {
                        ajax_loader = $('<div id="ajax_space" />').appendTo($('body'));
                    }
                    ajax_loader.load(url + ' div.ajax_copy', function() {
                        ajax_loader.appendTo(parent);
                        ajax_loader.append('<button>Close</button>');
                        ajax_loader.fadeIn('fast');
                    });
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
