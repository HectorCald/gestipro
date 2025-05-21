const CACHE_NAME = 'totalprod-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/css/login.css',
    // Puedes agregar más recursos estáticos aquí
];

// Crear el Map para la cola de sincronización
const syncQueue = new Map();

// Instalación y precarga de recursos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', event => {
    // Tomar el control inmediatamente
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                             .map(cacheName => caches.delete(cacheName))
                );
            })
        ])
    );
});

// Estrategia de cache simplificada: Network First con fallback a cache
self.addEventListener('fetch', event => {
    // No interceptar solicitudes a otros dominios o no GET
    if (!event.request.url.startsWith(self.location.origin) || 
        event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Si la respuesta es válida, la guardamos en cache
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intentamos recuperar de cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Si no hay caché y era una solicitud POST/PUT/DELETE, la guardamos para sincronizar
                        if (event.request.method === 'POST' || 
                            event.request.method === 'PUT' || 
                            event.request.method === 'DELETE') {
                            
                            // Esta parte no se ejecutará por el filtro de arriba, pero lo dejamos por si cambias la lógica
                            syncQueue.set(event.request.url, event.request.clone());
                            
                            // Registrar tarea de sincronización
                            if ('sync' in self.registration) {
                                self.registration.sync.register('sync-data')
                                    .catch(err => console.error('Error al registrar sync:', err));
                            }
                        }
                        
                        // Para solicitudes que no están en caché
                        return new Response('', {
                            status: 504,
                            statusText: 'Sin conexión a Internet'
                        });
                    });
            })
    );
});

// Manejar sincronización en segundo plano
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            Promise.all(
                Array.from(syncQueue.entries()).map(([url, request]) => {
                    return fetch(request)
                        .then(response => {
                            if (response.ok) {
                                syncQueue.delete(url);
                            }
                            return response;
                        })
                        .catch(error => {
                            console.error('Error en sincronización:', error);
                        });
                })
            )
        );
    }
});

// Notificar al cliente cuando la app está lista para usar offline
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});