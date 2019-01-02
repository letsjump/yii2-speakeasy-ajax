/*
 * @package   yii2-easy-ajax
 * @author    Gianpaolo Scrigna <letsjump@gmail.com>
 * @link https://github.com/letsjump/yii2-easy-ajax
 * @copyright Copyright &copy; Gianpaolo Scrigna, beintech.it, 2018
 * @version   $version
 */

window.yii.easyAjax = (function ($) {

    "use strict";

    var modalId = '#' + yea_modalid;

    var modal = jQuery(modalId);

    var originalModal = null;

    var pub = {
        // whether this module is currently active. If false, init() will not be called for this module
        // it will also not be called for all its child modules. If this property is undefined, it means true.
        modal: modal,
        //originalModal: originalModal,

        init: function () {
            originalModal = modal.clone();
        },

        request: function (type, url, data) {
            return $.ajax({
                url:      url,
                dataType: 'json',
                type:     type
            }).done(function (data) {
                pub.response(data);
            });
        },

        response: function (data) {
            if (data && typeof data !== "undefined") {
                jQuery.each(data, function (key, value) {
                    if (typeof value === "object") {
                        jQuery.each(value, function (myFunction, parameters) {
                            if (typeof methods[myFunction] === "function") {
                                methods[myFunction](parameters);
                            }
                        });
                    }
                });
            }
        },

        resetModal: function () {
            jQuery(modalId).remove();
            jQuery(".modal-backdrop").remove();
            $("body").append(originalModal.clone());
            modal = jQuery(modalId);
        },

    };

    var methods = {

        yea_confirm: function (data) {
            if (confirm(data.message)) {
                jQuery.get(data.url, function (response) {
                    if(typeof data.processResponse && data.processResponse === true) {
                        pub.response(response);
                    }
                });
            }
        },

        yea_redirect: function (data) {
            if(data.ajax === true) {
                jQuery.get(data.url, function (response) {
                    if(typeof data.processResponse && data.processResponse === true) {
                        pub.response(response);
                    }
                });
            } else {
                window.location.href = data.url;
            }
        },

        yea_content_replace: function (data) {
            jQuery.each(data, function (tagId, tagContent) {
                jQuery(tagId).html(tagContent);
            });
        },

        yea_form_validation: function (data) {
            jQuery.each(data, function (formId, formErrors) {
                jQuery.each(formErrors, function (key, val) {
                    jQuery(formId).yiiActiveForm("updateAttribute", key, [val]);
                });
            });
        },

        yea_tabs_reload: function (data) {
            modal.find(".tabs-krajee").tabsX("flushCache", data);
            jQuery(modal).find("li.active a").trigger("click");

        },

        yea_pjax_reload: function (data) {
            //Rebuild container_id as object if necessary
            jQuery.each(data, function (index, container) {
                if (!jQuery.isPlainObject(container)) {
                    data[index] = {};
                    data[index].container = container;
                }
                //Add timeout if not exist in the container object
                if (!("timeout" in data[index])) {
                    data[index].timeout = jQuery(data[index].container).attr("data-pjax-timeout");
                }
                //Removes elements to reload passed from the controller that not exist in page avoid javascript error in console
                //Happen when same controller is used in different page and so need to reload different elements in different pages
                if (!jQuery(container).length) {
                    data.splice(index, 1);
                }
            });
            if (data.length) {
                //Reload containers when the previous end loading
                jQuery.each(data, function (index, container) {
                    if (index + 1 < data.length) {
                        jQuery(container.container).one("pjax:end", function (xhr, options) {
                            jQuery.pjax.reload(data.yea_pjax_reload[index + 1]);
                        });
                    }
                });
                jQuery.pjax.reload(data[0]);
            }
        },

        yea_modal: function (data) {
            pub.resetModal();
            if (typeof data.title !== "undefined") {
                modal.find(".modal-header h4").html(data.title);
            }
            if (typeof data.content !== "undefined") {
                modal.find(".modal-body").html(data.content);
            }
            //if exist phantomModal create all html required into the modal
            if (typeof data.options !== "undefined") {
                if (typeof data.options.phantomModal !== "undefined") {
                    modal.find(".modal-content").addClass("phantom-modal");
                    modal.find(".modal-body").append('<div class="phantom-content"><div class="phantom-header" /><div class="phantom-body" /></div>');
                    // fix bug AdminLTE options finché non viene rilasciata la nuova versione
                    // jQuery('<button type="button" class="close"' + o.phantomModal.phantomModalToggleSelector.slice(1, -1) + ' aria-hidden="true">×</button>').appendTo(modal.find('.modal-body .phantom-header'));
                    jQuery('<button type="button" class="close"' + '[data-widget="phantom-content-toggle"]'.slice(1, -1) + ' aria-hidden="true">×</button>').appendTo(modal.find(".modal-body .phantom-header"));
                    modal.find(".modal-body > div:first").addClass("phantom-brother");
                }
            }
            if (typeof data.footer !== "undefined") {
                modal.find(".modal-footer").html(data.footer);
            }

            if (typeof data.size !== "undefined") {
                modal.find(".modal-dialog")
                    .addClass(data.size);
            }
            if (typeof data.addClass !== "undefined") {
                jQuery.each(data.addClass, function (key, val) {
                    modal.addClass(val);
                });
            }

            modal.modal();
        },

        yea_modal_close: function () {
            $("[data-dismiss=modal]").trigger({type: "click"});
        },

        yea_notify: function (data) {
            jQuery.notify(data.options, data.settings);
        }
    }

    // modal.on("shown.bs.modal", function () {
    //     modal.find("[autofocus]").focus();
    //     if (modal.find("[autofocus]").not(":focus")) {
    //         setTimeout(function () {
    //             modal.find("[autofocus]").focus();
    //         }, 200);
    //     }
    // });

    // ... private functions and properties go here ...

    return pub;

})(window.jQuery);

jQuery(document).ready(function () {
    //yii.easyAjax.init();
    jQuery(document)
        .on("click", ".open-modal, [data-ajax='1']", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            //console.log(this);
            var request_method = (jQuery(this)[0].hasAttribute("data-yea-method") && jQuery(this).attr("data-yea-method") === "post") ? "post" : "get"
            var attribute = jQuery(this)[0].hasAttribute("data-href") ? "data-href" : "href";
            if (jQuery(this)[0].hasAttribute("data-yea-confirm")) {
                if (confirm(jQuery(this).attr("data-yea-confirm"))) {
                    yii.easyAjax.request(request_method, jQuery(this).attr(attribute));
                }
            } else {
                yii.easyAjax.request(request_method, jQuery(this).attr(attribute));
            }
        })
        .keypress(function (e) {
            if (e.which === 13 && ($("#" + yea_modalid).data("bs.modal") || {}).isShown && !$("textarea").is(":focus")) {
                e.preventDefault();
                e.stopImmediatePropagation();
                $("#modalform-submit").click();
            }
        })
        .on("click", ".modalform-submit, #modalform-submit", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var forms = $(this).data("formid");
            jQuery.each(forms, function (index, name) {
                var form = $("#" + name);
                var data = form.serializeArray();
                data.push({name: "yea-save", value: true});
                $.ajax({
                    type:    form.attr("method"),
                    url:     form.attr("action"),
                    data:    data,
                    success: function (data) {
                            yii.easyAjax.response(data);
                            if (data.yea_success === true) {
                                $("[data-dismiss=modal]").trigger({type: "click"});
                            }
                        //}
                    }
                });
            });
        });
});