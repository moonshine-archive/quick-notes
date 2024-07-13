---
title: "API 만들기 예제 (TypeScript, NodeJS, Express)"
---

## api 만들기 전 초기 설정

> [code example](https://github.com/moonshine-archive/ts-express-playground/tree/main/api-in-depth)

### 라이브러리 설치

```zsh
npm init
npm install -D typescript ts-node nodemon
tsc --init
npm install express dotenv
npm install -D @types/express @types/node
```

package.json에서 main을 의미하는 entry point는 일반적으로 빌드 폴더 내부를 가리키는 게 일반적이지만, 라이브러리가 아니면 자유롭게 지정해주면 된다.<br>

작은 프로젝트에서 로깅은 불필요할 수 있지만, 이후 확장성에 도움이 된다.<br>
프로젝트 규모가 커지고 복잡해지면 [winston](https://github.com/winstonjs/winston) 같은 로깅 라이브러리를 사용하기도 하지만, 당장은 직접 구현하는 정도만 해도 충분하다.

- [config](https://github.com/moonshine-archive/ts-express-playground/blob/main/api-in-depth/src/config/config.ts)
- [logging](https://github.com/moonshine-archive/ts-express-playground/blob/main/api-in-depth/src/config/logging.ts)

### 서버 인스턴스 제어

`express()`는 일반적으로 router로 취급하지만 예제에서는 application으로 정의한다.<br>
`httpServer` 변수는 서버 종료/생성 역할을 하므로 `ReturnType<typeof http.createServer>` 타입으로 정의한다.<br>
로그는 logging으로만 사용한다.

http 라이브러리 요약

1. node.js 핵심 모듈 중 하나이다. http 서버와 클라이언트 생성 기능을 제공한다.
2. `http.createServer()` 메서드로 http 서버를 생성할 수 있다. (http 요청을 보내는 클라이언트 기능도 제공)
3. http 프로토콜을 직접 다룰 수 있는 저수준 api를 제공한다. (express도 내부적으로 http 모듈 기반으로 동작한다.)
4. node.js의 event driven architecture에 따라 비동기적으로 동작한다.

express가 내부적으로 http를 사용함에도 불구하고 별도로 사용하는 이유는 다음과 같다.

1. 서버 인스턴스 직접 제어 => `http.createServer(application)`를 사용해 http 서버 인스턴스를 직접 생성하고 관리한다. => 서버의 생명주기를 보다 세밀하게 제어할 수 있다. (예를 들어, 해당 예제에서는 `httpServer.close()`로 서버를 명시적으로 종료할 수 있는 코드도 작성해두었다.)
2. 서버 연결 관리, 타임아웃 설정 등 express에서 제공하지 않는 추가적인 이벤트나 메소드(혹은 웹소켓 등의 추가적인 프로토콜을 쉽게 통합 가능)를 사용하기 위해서이다.
3. 테스트 및 유연성 => 서버 인스턴스를 직접 제어함으로써 테스트 환경에서 서버를 쉽게 모킹하거나 수정할 수 있다.

참고로, `httpServer = http.createServer(application);`는 api가 express api라는 걸 알 수 있게 해주는 역할이기도 한다.

- [server.ts](https://github.com/moonshine-archive/ts-express-playground/blob/main/api-in-depth/src/server.ts)

### 미들웨어 생성

다양한 미들웨어를 위 server.ts에 import해서 개발 환경의 초기 설정을 구축한다.

#### loggingHandler

[loggingHandler.ts](https://github.com/moonshine-archive/ts-express-playground/blob/main/api-in-depth/src/middleware/loggingHandler.ts)

위 로깅 핸들러에서는 크게 3가지 로그를 추적한다. (METHOD, URL, IP)<br>
Response에서는 Status를 추가적으로 로그를 남긴다.

#### corsHandler

[corsHandler.ts](https://github.com/moonshine-archive/ts-express-playground/blob/main/api-in-depth/src/middleware/corsHandler.ts)

CORS는 웹 브라우저에서 보안상의 이유로 다른 출처(origin)의 리소스에 대한 접근을 제한하는 메커니즘이다.

예제이므로 일단 모든 출처를 허용한다. `res.header('Access-Control-Allow-Origin', req.header('origin'));`<br>
클라이언트가 사용할 수 있는 HTTP 헤더를 지정한다. `res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');`<br>
인증된 요청을 허용한다. `res.header('Access-Control-Allow-Credentials', 'true');`<br>

options 메서드로 오는 `preflight` 요청을 처리하기 위한 코드가 포함되어 있다.

#### routeNotFound

[routeNotFound.ts](https://github.com/moonshine-archive/ts-express-playground/blob/main/api-in-depth/src/middleware/routeNotFound.ts)

요청이 api를 통과했지만, 올바른 경로가 아닌 경우에 대한 처리를 담당하는 미들웨어다.

### Testing (supertest, jest)

[integration test](https://github.com/moonshine-archive/ts-express-playground/blob/main/api-in-depth/test/integration/application.test.ts)

supertest는 express.js 통합 테스트용 라이브러리다. (내부적으로 express 서버 구동시켜서 가상 요청 보내고 결과 검증)<br>통합 테스트는 단위 테스트의 전체 프로세스를 테스트하는 반면 jest는 메서드 레벨의 단위 테스트 목적의 라이브러리다.

## References

[Typescript API in NodeJS / Express in Depth [Part 1]](https://www.youtube.com/watch?v=NYZKUTGC51g&t=135s)<br>
