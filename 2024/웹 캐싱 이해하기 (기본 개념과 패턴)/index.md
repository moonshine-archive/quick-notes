---
title: "웹 캐싱 이해하기 (기본 개념과 패턴)"
---

## Basic Concept of Cache

Cache is a technology that stores frequently used data in a location for quick access.<br>
In web development, using cache can significantly improve performance.<br>

캐싱을 올바르게 구현했을 때 이점 => `성능 향상` / `대역폭 절약(saves bandwidth)` / `서버 비용 절약`<br>
올바르게 구현하기 어렵고, 캐싱을 제대로 하지 않으면 오히려 race condition들을 만들어내기 쉽다. (즉, 서로 의존적인 리소스들이 동기화되지 않는(getting out of sync) 문제가 발생한다.)

- Race Condition(경쟁 조건)이란 2개 이상의 프로세스가 공유 자원에 동시에 접근할 때 발생하는 문제다. (캐싱에서 여러 요청이 동시에 발생할 때 데이터 일관성이 깨지는 경우가 종종 있다.)
- Sync는 여러 데이터나 프로세스의 상태를 일치시키는 과정이다. 캐싱의 경우, 서버의 최신 데이터와 캐시된 데이터가 일치하도록 유지하는 게 중요하다.

올바른 캐싱 전략

- 적절한 캐시 무효화(invalidation) 정책 구축
- 버전 관리를 통한 리소스 갱신
- 조건부 요청(conditional requests) 사용
- 캐시 계층(cache hierarchies) 지원

### Browser Cache

Browser cache stores resources like web pages, images, and scripts locally.<br>
This allows quick loading from local storage instead of downloading from the server when the same resource is requested again.<br>

### Cache Control

You can control caching using HTTP headers. Key headers include Cache-Control, ETag, and Expires.<br>
For example, if the server sends the following header: `Cache-Control: max-age=3600`, This resource will be cached for 1 hour.<br>

### Caching with Service Workers

Service workers act as a proxy between the browser and the network, allowing for more fine-grained control over caching.<br>
Here's a simple service worker example:

```js
// service-worker.js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("my-cache").then((cache) => {
      return cache.addAll(["/", "/styles/main.css", "/scripts/main.js"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

This service worker caches key resources during installation and returns cached responses when available for network requests.

### Memory Cache

You can also cache data in the browser's memory. Here's a simple implementation of a memory cache in JavaScript:

```js
const memoryCache = {
  data: {},
  set: function (key, value, ttl) {
    this.data[key] = {
      value: value,
      expiry: Date.now() + ttl,
    };
  },
  get: function (key) {
    const item = this.data[key];
    if (item && item.expiry > Date.now()) {
      return item.value;
    }
    return null;
  },
};

// Usage example
memoryCache.set("user", { name: "John" }, 60000); // Cache for 1 minute
const user = memoryCache.get("user");
```

## 캐싱 전략 패턴

캐싱 전략에도 패턴들이 존재한다.

### Pattern 1 : Immutable content + long max-age

URL이 변할 일이 없는 콘텐츠에 사용한다.

```
Cache-Control: max-age=31536000
```

캐싱 전략은 패턴화되어 있는데 그 중 하나가 `Immutable content + long max-age` 패턴이다.<br>
이름 그대로 immutable(변하지 않는) 콘텐츠에 대해 캐시 기간을 길게 설정하는 전략이다. 주로 static assets을 다룰 때 사용한다.

max-age에 리소스가 캐시에서 신선하다고 간주되는 최대 시간(초 단위) 값을 지정할 수 있다. (31536000면 1년에 해당한다.)<br>
주로 버전이 포함된 static assets(예를 들어, app-v1.0.0.js), 내용이 변경되지 않는 이미지 파일, 폰트 파일 등에 해당한다.<br>

콘텐츠가 변경될 가능성이 있다면 파일 이름에 버전이나 해시를 포함시키곤 한다.<br>
`Cache-busting` => 콘텐츠가 변경되면, URL을 변경해 새로운 버전을 강제로 다운로드하도록 하는 기법이다.<br>
(예를 들어, style.css → `style.v2.css 또는 style.css?v=2`)

HTTP 응답에 `Cache-Control: immutable` 헤더를 추가하면 브라우저에게 이 리소스가 절대 변경되지 않는다고 말해줄 수 있다.

### Pattern 2 : Mutable content, always server-revalidated

URL의 콘텐츠가 변할 수 있는 경우, 그리고 서버의 확인 없이는 로컬의 캐시된 버전을 신뢰할 수 없을 때 사용하는 패턴이다.

```
Cache-Control: no-cache
```

`no-cache`는 don't cache를 의미하지 않는다. 대신 cached resource를 사용하기 전에 서버에게 체크하는 과정을 거쳐야 한다는 의미이다. (revalidate이라고 부른다.)<br>
no-cache처럼 키워드와 동작 방식이 매칭되지 않는 키워드가 또 있는데, 바로 `must-revalidate`이다. `must-revalidate`는 must revalidate를 의미하지 않는다. 제공 받은 `max-age` 값보다 young한 local 리소스만 사용할 수 있고, 그렇지 않으면 revalidate해야 한다는 의미다.

이 패턴에서는 `ETag`(a version ID of your choosing) 또는 `Last-Modified` Date 헤더를 추가할 수 있다. 클라이언트 다음에 리소스를 fetch해올 때, 이미 가지고 있는 콘텐츠 값을 각각 `If-None-Match`와 `If-Modified-Since`를 통해 이미 가지고 있는 리소스가 최신이라고 말할 수 있게 한다. 서버를 이를 `HTTP 304`로 표현한다.

만약에 `ETag`나 `Last-Modified`를 보내는 게 불가능하다면, 서버는 항상 전체 콘텐츠를 보낸다.

이 패턴은 항상 network fetch를 수반하기 때문에 캐싱 관점에서만 보자면, `패턴 1(네트워크 완전히 우회)`만큼 좋지는 않다.

패턴 1에 필요한 인프라에 부담을 느끼고, 동시에 패턴 2가 요구하는 네트워크 요청도 부담스러워 중간 지점을 선택하는 경우가 흔하다. => 주로 작은 max-age 값과 가변적인 콘텐츠(a smallish max-age and mutable content.)를 사용하는 방식의 우회인데, 이는 나쁜 타협이다. 왜?

- Mutable content : 시간이 지나면 변경될 수 있는 가변 컨텐츠를 의미한다.
- Server revalidation : 캐시된 리소스를 사용하기 전에 서버에 해당 리소스가 여전히 유효한지 확인하는 과정
- no-cache vs no-store:
  - no-cache: 캐시는 허용하지만, 사용 전 서버 확인이 필요함.
  - no-store: 캐시 자체를 허용하지 않음.
- ETag와 Last-Modified :
  - ETag: 리소스의 특정 버전을 식별하는 고유한 문자열.
  - Last-Modified: 리소스가 마지막으로 수정된 날짜와 시간.
- If-None-Match와 If-Modified-Since : 클라이언트가 이전에 받은 ETag와 Last-Modified 값을 서버로 보내 리소스의 변경 여부를 확인.
- HTTP 304 (Not Modified) : 서버가 클라이언트의 캐시된 버전이 여전히 유효함을 알려주는 응답.

max-age와 mutable content로 타협하는 게 안 좋은 이유는 => 콘텐츠가 변경되었음에도 max-age가 오래된 버전을 허용할 수 있기 때문이다.

- mutable content를 다뤄야 한다면 no-cache나 매우 짧은 max-age를 사용하는 게 안전하다.

결국 중요한 건 성능과 데이터 신선도 사이에서 균형을 잡는 것이다.

### max-age on mutable content is often the wrong choice

```
Cache-Control: must-revalidate, max-age=600
```

mutable content를 max-age로 타협하는 건 테스트 환경에서는 잘 동작하더라도 실제 production 환경에서는 문제를 일으키기 쉽다. 게다가 문제를 추적하기도 어렵다.

예를 들어 새로운 html, css, js 등을 업데이트할 때, 이들 리소스는 서로 의존적이다. 반면 caching header들은 이러한 상황을 표현할 방법이 없다. 그러다 보니 사용자들은 의도치 않게 3개 중 2개 리소는 구 버전을 사용하고 다른 하나만 신 버전을 사용하는 문제가 발생하기도 한다.

`max-age`는 응답 시간(response time)을 기준으로 하기 때문에 => 동일한 요청에 포함된 모든 리소스는 대략 같은 시간에 만료되지만, 그럼에도 작은 race condition의 가능성이 존재한다. 예를 들어 일부 페이지에서는 js를 포함하지 않거나 혹은 서로 다른 css 리소스를 포함한다면, expiry date의 싱크가 안 맞을 수 있다. 게다가 브라우저가 캐시 항목을 정리할 때, 특정 리소스들이 의존적이라는 걸 인지하지 못한다. => 이 모든 게 복합적으로 얽히다 보면 리소스들의 버전 불일치 가능성이 높아지게 된다.

- 웹 상에서 Race condition이 발생하면 => 여러 리소스가 동시에 요청되고 캐시되는 과정에서 미세한 시간 차이로 일부는 캐시되고 일부는 새로 요청될 수 있다.
- 브라우저는 저장 공간 관리를 위해 주기적으로 캐시에서 항목을 제거한다. 이 과정에서 브라우저는 의존 관계를 모르기 때문에, 의존적인 리소스 중 일부만 제거하는 상황이 종종 발생한다.

### there's an escape hatch for the user

새로고침(A refresh)이 때때로 문제를 해결한다.<br>
페이지가 새로고침되면 브라우저는 항상 `max-age`를 무시하고 서버와 재검증을 수행한다. 그러므로 max-age 때문에 문제가 발생하는 경우라면 새로고침으로 문제를 해결할 수 있다. => 사용자에게 새로고침을 요구하는 건 부담스러운 일이기에 완벽한 해결책이 될 수 없다.

서비스 워커를 사용하면 `max-age`로 발생하는 버그 수명을 연장시킬 수 있다.<br>

```js
const version = "2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(`static-${version}`)
      .then((cache) => cache.addAll(["/styles.css", "/script.js"]))
  );
});

self.addEventListener("activate", (event) => {
  // …delete old caches…
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

위 코드를 보면, 서비스 워커는 scrip와 styles를 미리 캐시해둔다.<br>
그리고 나서 서비스 워커는 매치되는 게 있으면 캐시에서 가져오고 그렇지 않을 때만 네트워크를 타도록 된다.

=> css/js를 변경했다면 version을 올린다. => 서비스 워커를 바이트 단위로 다르게 만들어서(make the service worker byte-different) 업데이트를 트리거한다. 하지만 `addAll`가 HTTP Cache로 fetch해오므로(사실 대부분 fetches가 그렇지만), 결과적으로 또 `max-age` race condition에 빠지고 호환되지 않는 버전의 css/js를 캐시하게 될 수 있다.

이렇게 한번이라도 캐시되면, 다음 서비스 워커가 업데이트될 때까지는 호환되지 않는 css/js를 제공하게 된다. (다음 업데이트에서 또 다른 경쟁 조건에 빠지지 않는다는 가정 하에.)

- 즉, 서비스 워커는 오프라인 기능과 성능 향상 목적으로 리소스를 캐시하는 강력한 도구지만, 잘못 구현하면 버전 불일치 문제를 더 오래 지속시킨다. (한번 캐시되면 다음 트리거까지 계속 버전 불일치 리소스 제공)

서비스 워커에서 캐시를 우회할 수도 있다.

```js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(`static-${version}`)
      .then((cache) =>
        cache.addAll([
          new Request("/styles.css", { cache: "no-cache" }),
          new Request("/script.js", { cache: "no-cache" }),
        ])
      )
  );
});
```

다만, cache 옵션은 최근에 나온 거라 모든 브라우저에서 지원하지 않는다. => 아래와 같이 직접 구현할 수도 있다.

```js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(`static-${version}`).then((cache) =>
      Promise.all(
        ["/styles.css", "/script.js"].map((url) => {
          // cache-bust using a random query string
          return fetch(`${url}?${Math.random()}`).then((response) => {
            // fail on 404, 500 etc
            if (!response.ok) throw Error("Not ok");
            return cache.put(url, response);
          });
        })
      )
    )
  );
});
```

위에서는 코드로 무작위 숫자로 cache-busting을 하고 있지만, 빌드 단계에서 콘텐츠에 해시를 추가할 수도 있다. ([sw-precache](https://github.com/GoogleChromeLabs/sw-precache)가 하고 있는 걸 참고해보면 좋을 듯 하다.) => 이 방법은 결국 JS에서 패턴 1을 다시 구현하는 것과 같으며, 다만 모든 브라우저와 CDN이 아니라 서비스 워커 사용자에게만 혜택을 부여하는 방법이다.

- 요약하자면, `cache: 'no-cache'` 옵션으로 HTTP 캐시를 우회할 수 있고, 브라우저 지원이 없을 경우 쿼리 문자열로 캐시 버스팅 방법으로 우회할 수 있다.
- 빌드 단계에서 리소스 내용을 해시해서 파일명이나 쿼리 문자열에 포함시키는 방법은 보다 더 안정적인 캐시 무효화 전략이다.

### The service worker & the HTTP cache play well together, don't make them fight!

```js
const version = "23";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(`static-${version}`)
      .then((cache) =>
        cache.addAll([
          "/",
          "/script-f93bca2c.js",
          "/styles-a837cb1e.css",
          "/cats-0e9a2ef4.jpg",
        ])
      )
  );
});
```

위 코드를 보면, 루트 페이지(`/`)에서는 패턴 2(server revalidation)을 사용해 캐시하고,<br>
나머지 리소스는 패턴 1(immutable content)을 사용해 캐시한다. 각 서비스 워커 업데이트는 루트 페이지에 대한 요청을 트리거하지만, 나머지 리소스는 URL이 변경된 경우에만 다운로드된다.

=> 사소한 변경에도 전체 바이너리를 다운로드하거나 복잡한 바이너리 비교를 수행해야 하는 네이티브 앱에 비해 장점을 갖는다.<br>
=> 상대적으로 적은 다운로드로 대규모 웹앱을 업데이트할 수 있다.

- 서비스 워커와 HTTP 캐시는 상호 보완적으로 동작하게 만들 수 있다. (HTTP 캐시는 브라우저 레벨에서 작동하고, 서비스 워커는 애플리케이션 레벨에서 더 세밀한 제어를 제공)
- 서비스 워커에서 캐싱 문제를 해결하려고 하기보다는, HTTP 캐싱 전략 자체를 개선하는 것이 더 효과적이다.
- 리소스 URL에 버전이나 해시를 포함시키는 것은 효과적인 캐시 무효화 전략이다. 이를 통해 변경된 리소스만 다운로드되도록 만들 수 있다.
- 하이브리드 캐싱 전략 => 루트 페이지에는 서버 재검증 전략을, 정적 리소스에는 불변 콘텐츠 전략을 사용하면 업데이트를 보장하면서도 불필요한 다운로드를 최소화할 수 있다. (상단 코드 참고.)
- 캐싱 문제를 해결할 때는 여러 레이어를 고려해야 한다. (HTTP 캐시, 서비스 워커, CDN 등 모든 레이어 고려 필요.)

#### max-age가 무조건 잘못된 건 아니다.

mutable content에서 max-age를 사용하는 건 대부분 잘못된 선택이지만, 모두 그렇지는 않다.<br>

max-age를 사용하면 CDN이 일정 기간 동안 캐시된 콘텐츠를 제공할 수 있어 서버 부하를 줄일 수 있다. (특히 트래픽 많은 사이트에서 유용)

---

## References

[Caching best practices & max-age gotchas](https://jakearchibald.com/2016/caching-best-practices/)<br>
[Github | Caching best practices & max-age gotchas](https://github.com/jakearchibald/jakearchibald.com/blob/main/static-build/posts/2016/04/caching-best-practices/index.md?plain=1)<br>
[The Offline Cookbook by Jake Archibald](https://web.dev/articles/offline-cookbook?hl=en)<br>
