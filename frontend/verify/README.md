# Verify Frontend
https://verify.infjew.com/

This folder contains the verify page used to search:
- precious tag code
- order code

## Files

- `index.html`: verify page markup
- `search.css`: verify page styles
- `search.js`: input formatting, validation, API requests, and URL param auto-search

## URL Query Auto Search

`search.js` has `getSearchContextFromURL()` and `runInitialURLSearch()`:
- `getSearchContextFromURL()` reads `window.location.search`
- it parses query params with `URLSearchParams`
- it only accepts 2 params: `search` and `value`
- `runInitialURLSearch()` is called during `bindEvents()` when the page loads

Relevant code locations:
- `search.js:1506` (`getSearchContextFromURL`)
- `search.js:1534` (`runInitialURLSearch`)
- `search.js:1638` (initial call on page load)

## Query Params

### 1) `search`

Allowed values:
- `tag`
- `order`

Any other value is ignored.

### 2) `value`

`value` is normalized to uppercase before validation.

For `search=tag`, format must match:
- `INF-[A-Z][0-9][0-9]-[A-Z][0-9][0-9]`
- example: `INF-W26-D01`
- source pattern: `TAG_CODE_PATTERN = /^INF-[A-Z]\d{2}-[A-Z]\d{2}$/`

For `search=order`, format must match:
- `INFO-[A-Z][0-9][0-9][0-9][0-9][0-9][0-9]`
- example: `INFO-X000000`
- source pattern: `ORDER_CODE_PATTERN = /^INFO-[A-Z]\d{6}$/`

## Example URLs

- Tag search:
  - `/verify/index.html?search=tag&value=INF-W26-D01`

- Order search:
  - `/verify/index.html?search=order&value=INFO-X000000`

## API Calls Triggered

When params are valid and auto-search runs:
- tag request: `GET /api/public/verify/tag?precious_code=<TAG_CODE>`
- order request: `GET /api/public/verify/order?order_code=<ORDER_CODE>`

If params are missing/invalid:
- no auto-search, or
- show "not found/invalid format" state depending on mode and value.
