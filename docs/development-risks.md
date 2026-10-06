# Development dependency risk assessment

Reviewed on 2026-10-06 against the committed lockfile. Full npm audit reports
six affected packages (two high, four moderate); these counts include packages
that inherit findings from dependencies. The production-only audit reports zero.
This distinction does not establish that development tooling is safe.

## Dependency paths and exposure

`@github/local-action@7.0.1` brings `@actions/github` and `@actions/artifact`.
Their dependency paths include `@actions/http-client`, undici 5.x and
`@fastify/busboy` 2.x. These are development dependencies, outside the Action's
production bundle. The installed packages constrain undici to 5.x; a compatible
lockfile refresh did not eliminate the findings. local-action 7.0.1 remains the
latest registry release at this review. npm's proposed force fix downgrades
local-action to 5.2.0, which is not an approved compatibility change.

The current greeting source calls only core input/output, logging and failure
APIs. It does not request remote content, parse multipart data, use WebSockets,
or call GitHub or artifact APIs. The standalone bundle tests exercise that
behavior with the real toolkit. This is a source-level exposure assessment, not
a proof that every path inside the local runner is unreachable.

The advisories concern attacker-controlled HTTP responses, request headers,
cookies, multipart values or WebSocket frames. New Action features that use
network services or those APIs may expose these paths during local execution.
Treat fetched data and endpoints as untrusted, and run local tests with minimal
credentials. Use mocks for hostile network fixtures and the real toolkit in
isolated integration tests. Do not use local-action against untrusted endpoints
with valuable credentials while these findings remain.

## Advisory inventory

### @fastify/busboy

- [@fastify/busboy vulnerable to Denial of Service via prototype-named multipart part header](https://github.com/advisories/GHSA-x8mw-p69m-v3mx)
  — high; affected range `>=1.0.0 <3.2.1`.
- [@fastify/busboy vulnerable to CRLF injection via multipart Content-Disposition filename and name](https://github.com/advisories/GHSA-gxm5-99cw-xjw9)
  — moderate; affected range `<3.2.2`.

### undici

- [Undici has an unbounded decompression chain in HTTP responses on Node.js Fetch API via Content-Encoding leads to resource exhaustion](https://github.com/advisories/GHSA-g9mf-h72j-4rw9)
  — moderate; affected range `<6.23.0`.
- [Undici has an HTTP Request/Response Smuggling issue](https://github.com/advisories/GHSA-2mjp-6q6p-2qxm)
  — moderate; affected range `<6.24.0`.
- [Undici has Unbounded Memory Consumption in WebSocket permessage-deflate Decompression](https://github.com/advisories/GHSA-vrm6-8vpv-qv8q)
  — high; affected range `<6.24.0`.
- [Undici has Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation](https://github.com/advisories/GHSA-v9p9-hfj2-hcw8)
  — high; affected range `<6.24.0`.
- [Undici has CRLF Injection in undici via `upgrade` option](https://github.com/advisories/GHSA-4992-7rv2-5pvq)
  — moderate; affected range `<6.24.0`.
- [undici vulnerable to HTTP header injection via Set-Cookie percent-decoding](https://github.com/advisories/GHSA-p88m-4jfj-68fv)
  — moderate; affected range `<6.27.0`.
- [undici WebSocket client vulnerable to denial of service via fragment count bypass](https://github.com/advisories/GHSA-vxpw-j846-p89q)
  — high; affected range `<6.27.0`.
- [undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching](https://github.com/advisories/GHSA-g8m3-5g58-fq7m)
  — low; affected range `<6.27.0`.
- [undici vulnerable to downstream response desynchronization via retry interceptor](https://github.com/advisories/GHSA-8xcm-r25x-g524)
  — moderate; affected range `<6.28.0`.
- [undici vulnerable to CRLF Injection via blob-like body 'type' property](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5)
  — moderate; affected range `<6.28.0`.
- [undici vulnerable to cookie attribute injection via unsanitized domain and unparsed setCookie fields](https://github.com/advisories/GHSA-v3r7-h72x-cjcm)
  — moderate; affected range `<6.28.0`.
- [undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse](https://github.com/advisories/GHSA-35p6-xmwp-9g52)
  — low; affected range `<6.27.0`.
- [undici vulnerable to downstream response splitting via retry interceptor](https://github.com/advisories/GHSA-r53p-7pc4-xj5r)
  — low; affected range `<6.28.1`.

## Accepted residual risk and recheck

Retain local-action for the existing non-network greeting and Inspector
workflow. Keep the findings visible; do not force transitive overrides,
downgrade the runner, or disable alerts to obtain a zero count. Reassess before
adding network, artifact, cookie, multipart or WebSocket behavior, whenever
local-action/toolkit releases change the dependency constraints, and on new
security alerts.

After a candidate update, regenerate the lockfile normally, repeat full and
production npm audit, run all checks and standalone bundles, and verify local
execution plus Inspector pause/resume. Remove this exception only after the
fixed dependency paths and working behavior are verified.
