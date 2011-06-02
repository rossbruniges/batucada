var batucada = window.batucada || {};

batucada.challenges = function() {
    var votes = $('#votes'), body_id = $('body').attr('id'), init, randomizr, vote_up, load_ideas;
    load_ideas = {
        load_content : function(url, dest) {
            var ajax_loader = $('#ajax_space');
            if (!ajax_loader.length) {
                ajax_loader = $('<div id="ajax_space" />').appendTo($('body'));
            }
            ajax_loader.load(url + ' div.ajax_copy', function() {
                ajax_loader.appendTo(dest);
                ajax_loader.append('<div class="meta"><p><a href="' + dest.find('a.more').attr('href')  + '">Add your comments to this idea and read about who submitted it</a></p><button>Close</button></div>');
                ajax_loader.fadeIn('fast');
            });
        },
        pull : function(target) {
            var url, parent, ajax_loader, sibs, num_sibs, tmp;
            url = target.attr('href'),
            parent = target.parents('li.submission'),
            sibs = parent.siblings(),
            num_sibs = sibs.length,
            tmp = 0;
            if (num_sibs !== 0) {
                sibs.fadeOut('normal', function() {
                    tmp++;
                    if (tmp === num_sibs) {
                        load_ideas.load_content(url,parent);
                    }
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
        vote : function(target) {
            var form, action, csrf, voting_html;
            form = target.parents('form');
            action = form.attr('action');
            csrf = form.find('input[name="csrfmiddlewaretoken"]').attr('value');
            voting_html = form.parent();
            $.ajax({
                type:"POST",
                dataType:"json",
                url:action,
                data:"csrfmiddlewaretoken=" + csrf + "",
                success:function(data) {
                    if (data.score.score === 1) {
                        var obj = vote_up.text_values.clear;
                    } else {
                        var obj = vote_up.text_values.up;
                    }
                    voting_html.css('visibility','hidden');
                    voting_html.find('span.score').text(data.score.num_votes);
                    voting_html.find('input.trigger').attr('value',obj.input_txt).attr('className',obj.input_cls);
                    form.find('p').text(obj.message);
                    form.attr('action',action.replace(/[a-z]{6,9}$/,obj.url_suffix));
                    voting_html.css('visibility','');
                }
            });
        }
    };
    randomizr = function() {
        var moar, num_entries; 
        moar =  $('<div id="browse"><button>Show me more ideas</button><p>Those are all the ideas for this challenge - <a href="'+ window.location.href +'">Start again</a></p></div>').insertAfter(votes);
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
    };
    init = function() {
        if (votes.length) {
            if (body_id === "challenge_landing") {
                console.log(votes.find('li.submission').length);
                console.log(votes.attr('data-total-votes'));
                if (votes.find('li.submission').length <= votes.attr('data-total-votes')) {
                    randomizr();
                }
            }
            votes.bind('click', function(e) {
                var elm = $(e.target);
                if (elm.is('input.trigger')) {
                    vote_up.vote(elm);
                    return false;
                }
                if (elm.is('a.more') && $('body').is('#challenge_landing')) {
                    load_ideas.pull(elm);
                    return false;
                }
                if (elm.is('button')) {
                    var parent = elm.parents('li.submission');
                    $('#ajax_space').fadeOut('normal', function() {
                        parent.siblings().fadeIn('normal');
                     });
                }
            });

        }
    };
    return {
        init:init
    }
}();

$(function() {
    batucada.challenges.init();
});
