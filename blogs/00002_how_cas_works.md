# How CAS Works

The Central Authentication Service (CAS) is a popular Single Sign-On (SSO) protocol in the web.

## login
Basic steps are:

1. user browser send request to app server.
1. app server find out the user not login yet, so it redirect to CAS server and provide __service__ url parameter in the redirect url, like `http://www.cas-server.com?service=http://www.app-server.com`.
1. then user browser display CAS server login page, after user login, CAS then redirect back to app server according to previous __service__ parameter value and append a __ticket__ parameter to app server url and plant a __TGC__ (Ticket Granting Cookie ) cookie in the response, like `http://www.app-server.com?ticket=xxxxxx`. The ticket only useful to CAS server.
1. after redirect back to app server, app server then send ticket to CAS for validation, if pass validation, CAS will supply user's NetID so app server know the identity of the user.

Normally, app server need save user identity and ticket after login successfully, as app server still need ticket to validate subsenqent request.

The TGC is under the domain of CAS server, normally with `path=/cas`. If a user logined into app server A, then visit app server B that use the same CAS for authentication, then TGC attach to the request and send to CAS, CAS analysis the TGC and find out this user aready logined, the redirect back to app server B with ticket appended to the redirect url, the app server B go through the CAS validation process and login automaticlly. This how SSO works.

___After CAS planted TGC to the response and send back to browser, all subsequent request to CAS server will attach TGC, the user identity, this is the key for CAS SSO.___


## logout
Each app server should provide their own logout functionality, invalidate session and redirect to CAS login page.
