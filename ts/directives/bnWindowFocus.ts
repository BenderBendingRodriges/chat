module App.Directives {
    "use strict"
    export function BnWindowFocusDirective($window, $log): ng.IDirective {
        return({
            link: link,
            restrict: "A"
        });
        // I bind the JavaScript events to the view-model.
        function link( scope, element, attributes ) {
            // Hook up focus-handler.
            var win = angular.element( $window ).on( "focus", handleFocus );
            // When the scope is destroyed, we have to make sure to teardown
            // the event binding so we don't get a leak.
            scope.$on( "$destroy", handleDestroy );
            // ---
            // PRIVATE METHODS.
            // ---
            // I teardown the directive.
            function handleDestroy() {
                win.off( "focus", handleFocus );
            }
            // I handle the focus event on the Window.
            function handleFocus( event ) {
                scope.$apply( attributes.bnWindowFocus );
                $log.warn( "Window focused." );
            }
        }
    }
}
