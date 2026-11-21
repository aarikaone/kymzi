# Google image delivery

Images are uploaded to `gs://kymzi-f1e9d-images`, a public-read, uniform-access, Standard bucket in the ASIA multi-region. Only the verified public image manifest is published; no environment files, source prompts, user profiles or administrator credentials are uploaded. Client writes are denied by bucket IAM.

Cloud CDN uses global backend bucket `kymzi-images-backend`, global URL map `kymzi-images-map`, HTTPS proxy `kymzi-images-https` and forwarding rule `kymzi-images-https-rule`. The global Premium IPv4 address is `136.69.105.195`. Google manages the certificate `kymzi-images-tls` and the project-specific hostname `images.endpoints.kymzi-f1e9d.cloud.goog`. The Endpoints service provides DNS only; image requests go directly through the load balancer and Cloud CDN to Storage.

`config.json` records these settings, `cors.json` records bucket CORS, and `dns-service.json` records the Google-managed DNS mapping. All administrator commands explicitly pin project `kymzi-f1e9d` and account `admin@nexilence.co`; the shell default project is not changed.

The bucket metadata permits one-year immutable caching. Cloud CDN uses CACHE_ALL_STATIC, a one-year maximum/client TTL, 60-second 404 caching, and request coalescing. The response header `X-Kymzi-Cache` exposes Cloud CDN's actual cache status. Cross-origin reads are allowed. Filenames contain content hashes and are never overwritten.

Publish with `npm run images:deploy`. The workflow prepares metadata, verifies/uploads immutable objects, verifies HTTPS CDN delivery, then imports only changed Firestore documents. Review statuses are retained. Legacy Hosting URL fields and the frozen Hosting image inventory keep installed older app versions working. New clients use `cdnImageUrl` and `publicCdnImages` from Firestore. A custom HTTPS CDN origin can later be configured in the server settings without rebuilding clients.

Verification receipts are saved under ignored `artifacts/cloud-storage/`. Canonical source artwork stays archived locally for reproducibility and is excluded from app bundles.
