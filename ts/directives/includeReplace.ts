module App.Directives {
    "use strict"
    export function IncludeReplaceDirective(): ng.IDirective {
        return {
            require: 'ngInclude',
            restrict: 'A', /* optional */
            link: function (scope, el, attrs) {
                // console.log("AAAAAAAAAA");
                el.replaceWith(el.children());
            }
        };
    }
}
