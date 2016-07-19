module App.Directives {
    "use strict"
    export function BnWindowBlurDirective($window, $log): ng.IDirective {
        return({
            link: link,
            restrict: "A"
        });
            // I bind the JavaScript events to the view-model.
            function link( scope, element, attributes ) {
                // Hook up blur-handler.
                var win = angular.element( $window ).on( "blur", handleBlur );
                // When the scope is destroyed, we have to make sure to teardown
                // the event binding so we don't get a leak.
                scope.$on( "$destroy", handleDestroy );
                // ---
                // PRIVATE METHODS.
                // ---
                // I handle the blur event on the Window.
                function handleBlur( event ) {
                    scope.$apply( attributes.bnWindowBlur );
                    $log.warn( "Window blurred." );
                }
                // I teardown the directive.
                function handleDestroy() {
                    win.off( "blur", handleBlur );
                }
            }
    }
}
