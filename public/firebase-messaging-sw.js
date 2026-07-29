// Firebase Messaging service worker
//
// Must live at the root path (/firebase-messaging-sw.js) — hardcoded by the
// FCM Web SDK. Handles background push delivery, notification display, and
// deep-link routing when the user taps a notification.
//
// Firebase Web config values below are public by design (embeddable in any
// client). No secrets in this file.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB2yJRmORcVhRMrFLSOQQ8EVKwgc8QxGIU",
  authDomain: "maximus-f0e7b.firebaseapp.com",
  projectId: "maximus-f0e7b",
  storageBucket: "maximus-f0e7b.firebasestorage.app",
  messagingSenderId: "499240641079",
  appId: "1:499240641079:web:04ec2b9dbee6bf2ddf55b2",
});

const messaging = firebase.messaging();

// Messages with a `notification` field are auto-displayed by FCM when the
// page is backgrounded. This handler catches `data`-only payloads or lets
// us customize the presentation.
messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || 'Maximus';
  var options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data || {},
    tag: (payload.data && payload.data.notification_id) || undefined,
  };
  self.registration.showNotification(title, options);
});

// Route the user to the right screen when the notification is tapped.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var data = event.notification.data || {};
  var type = data.notification_type || data.type || '';
  var entity = data.entity_id || '';
  var path = '/';

  if (type === 'chat_message') {
    path = (data.booking_id || entity) ? '/chat/' + (data.booking_id || entity) : '/';
  } else if (type === 'service_request' || type === 'request_received') {
    path = entity ? '/provider/jobs/' + entity : '/provider/dashboard';
  } else if (type === 'quote_sent' || type === 'quote_accepted') {
    path = entity ? '/client/bookings/' + entity : '/client/bookings';
  } else if (
    type === 'booking_confirmed' ||
    type === 'appointment' ||
    type === 'provider_assigned' ||
    type === 'provider_en_route' ||
    type === 'provider_arrived' ||
    type === 'appointment_cancelled' ||
    type === 'appointment_changed'
  ) {
    path = entity ? '/client/bookings/' + entity : '/client/bookings';
  } else if (type === 'service_completed' || type === 'job_completed') {
    path = entity ? '/client/bookings/' + entity : '/client/bookings';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c && 'navigate' in c) {
          c.navigate(path);
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(path);
      return null;
    })
  );
});
