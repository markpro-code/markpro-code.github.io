# Javascript Full Stack Guide

## Three Layer Archtecture
1. __Controller Layer__: handle request from routes, decide render a view or call a service.
1. __Service Layer__: perform business logic, CRUD or call another service.
1. __Data Access Layer__

Why 3 layers ? Scalibility and Modularity, as app grows, you can still hold the complexity.

Don’t put business logic inside controller layer, as it will become messy when write unit test, you have to mock every reqest and response. use service layer for your business logic.
