const CACHE_NAME = "daily-hub-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/config.js",
  "./js/app.js",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(
          cache =>
            cache.addAll(
              APP_SHELL
            )
        )
    );

    self.skipWaiting();

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      caches
        .keys()
        .then(
          keys =>
            Promise.all(
              keys
                .filter(
                  key =>
                    key !== CACHE_NAME
                )
                .map(
                  key =>
                    caches.delete(key)
                )
            )
        )
    );

    self.clients.claim();

  }
);


self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method
      !== "GET"
    ) {
      return;
    }


    const requestURL =
      new URL(
        event.request.url
      );


    if (
      requestURL.origin
      !== self.location.origin
    ) {
      return;
    }


    event.respondWith(

      fetch(
        event.request
      )
        .then(
          response => {

            const copy =
              response.clone();


            caches
              .open(
                CACHE_NAME
              )
              .then(
                cache =>
                  cache.put(
                    event.request,
                    copy
                  )
              );


            return response;

          }
        )
        .catch(
          () =>
            caches.match(
              event.request
            )
        )

    );

  }
);
