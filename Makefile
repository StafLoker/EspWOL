# OpenAPI docs
apidocs:
	npx @redocly/cli build-docs docs/openapi.yaml --title "EspWOL" -o docs/openapi-web.html

.PHONY: apidocs