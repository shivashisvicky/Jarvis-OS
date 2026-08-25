# CI sanity

The deployed in-shell web-search gate now waits for the web-search authority readiness marker before exercising the live UI. This removes a boot-time race from the CI contract without weakening the product behavior being tested.
