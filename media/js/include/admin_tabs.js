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

