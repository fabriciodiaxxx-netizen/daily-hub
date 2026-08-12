const CACHE_NAME = "daily-hub-v5";

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


self.addEventListener("install", event => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();

});


self.addEventListener("activate", event => {

  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
  );

  self.clients.claim();

});


self.addEventListener("fetch", event => {

  if (
    event.request.method !== "GET"
  ) {
    return;
  }


  const requestURL =
    new URL(event.request.url);


  if (
    requestURL.origin !== self.location.origin
  ) {
    return;
  }


  event.respondWith(
    fetch(event.request)
      .then(response => {

        const copy =
          response.clone();


        caches
          .open(CACHE_NAME)
          .then(cache =>
            cache.put(
              event.request,
              copy
            )
          );


        return response;

      })
      .catch(() =>
        caches.match(
          event.request
        )
      )
  );

});


self.addEventListener("push", event => {

  let data = {
    title: "Daily Hub",
    body: "Tenés un recordatorio pendiente.",
    url: "./"
  };


  if (
    event.data
  ) {

    try {

      data =
        {
          ...data,
          ...event.data.json()
        };

    }

    catch {

      data.body =
        event.data.text();

    }

  }


  event.waitUntil(
    self.registration
      .showNotification(
        data.title || "Daily Hub",
        {
          body:
            data.body
            || "Tenés un recordatorio pendiente.",

          icon:
            "./assets/icons/icon-192.png",

          badge:
            "./assets/icons/icon-192.png",

          tag:
            data.tag
            || "daily-hub",

          data: {
            url:
              data.url
              || "./"
          }
        }
      )
  );

});


self.addEventListener(
  "notificationclick",
  event => {

    event.notification.close();


    const targetURL =
      new URL(
        event.notification.data?.url || "./",
        self.location.origin
      ).href;


    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(windowClients => {

          for (
            const client
            of windowClients
          ) {

            if (
              client.url === targetURL
              && "focus" in client
            ) {
              return client.focus();
            }

          }


          if (
            clients.openWindow
          ) {
            return clients.openWindow(
              targetURL
            );
          }

        })
    );

  }
);
