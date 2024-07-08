---
title: "Express + TypeScript 기초 튜토리얼 가이드"
---

> [code example](https://github.com/moonshine-archive/ts-express-example/commits/v1.0.0)

`node_modules/.bin/tsc` 파일은 실행할 수 있는 바이너리 파일이다. 우리가 사용할 TSC 스크립트이기도 하다.<br>
npm에서 타입 파일은 `@types` prefix가 붙는 게 npm registry 표준이다.<br>
ts 확장자 파일을 그대로 `node` 명령어로 실행하면 오류가 발생한다.

- 기본적으로 ts는 es 모듈을 사용하는 반면, node 커멘드는 기본적으로 모든 파일이 commonjs일 것이라고 가정하기 때문이다. (package.json에서 지정할 수 있으나, ts와 commonjs를 같이 쓰지 않으려면 2가지 방법이 존재한다.)
  1. ts에서 js로 트랜스파일한 다음, node 커맨드로 js를 실행하는 방법
  2. ts 전용 node TS를 사용하는 방법

`npx tsc` 명령어를 사용하면 기본적으로 node_modules 안에 로컬로 설치된 tsc 바이너리를 사용하게 된다.<br>
`npx tsc --init` 커맨드를 사용하면 tsconfig.js 파일이 생성된다.

tsconfig.js에서 가장 먼저 해야 할 건, 트랜스파일 할 경로(`rootDir`)와 트랜스파일된 파일이 위치할 경로(`outDir`)를 지정하는 것이다.
tsconfig.js 설정이 끝났다면 `npx tsc --build` 커맨드로 트랜스파일이 가능하다.

- 해당 명령어를 package.json 안에 입력하면 npx를 붙이지 않아도 된다. 우리의 patch 내부에서 일어나는 일이기 때문이다. (node_modules 폴더 내부를 살펴보고 내부에 bin 안에 있는 tsc 실행 파일이 존재하기 때문이다.)
- nodemon으로 index.ts를 실행하려면 `ts-node`가 필요하다. (ts-node를 설치하면 bin 폴더 안에 실행파일 ts-node가 설치된 걸 확인할 수 있다.)
  1. 예를 들어, `npx ts-node ./src/index.ts`와 같이 커맨트를 입력해 ts 파일을 실행할 수 있다.

express의 `Request, Response` 타입은 제네릭으로 확장해서 사용할 수 있다.

```ts
// src/handlers/users.ts

export function getUserById(request: Request, response: Response) {
  response.send({});
}

export function createUser(
  request: Request<{}, {}, CreateUserDto, CreateUserQueryParams>,
  response: Response<User>
) {
  response.status(201).send({
    id: 1,
    username: "user1",
    email: "user1@email.com",
  });
}
```

일반적으로 index.ts에 모든 걸 작성하지 않는다.<br>
routes로 쪼개고, 각 route에서 사용하는 핸들러 함수를 handlers로 또 다시 분리한다.<br>
핸들러는 재사용하기가 쉽고 테스트가 필요한 경우가 많다. 이때 핸들러가 route 안에 익명함수로 존재하면 재사용하거나 테스트하기가 어렵다.

dto는 기본적으로 한 쪽에서 다른 쪽으로 전송되는 데이터를 나타내는 방법이다. (즉, 클라이언트에서 서버로 혹은 서버에서 클라이언트로 전송되는 데이터를 말한다.)

express의 Request, Response는 express-serve-static-core에서 가져와야 한다.

`Declaration Merging` : 자체 선언 파일을 만들어 ts 컴파일러가 네임스페이스를 확장해서 사용할 수 있게 하는 방법이다.

```ts
// index.d.ts

import * as express from "express-serve-static-core";

declare global {
  namespace Express {
    interface Request {
      customField?: string;
    }
  }
}
```

각 핸들러에 대해 단위 테스트를 진행하면 되고,<br>
e2e를 위해 createApp으로 분리한다.

```ts
// src/e2e/index.test.ts

import request from "supertest";
import { type Express } from "express-serve-static-core";
import { createApp } from "../createApp";

describe("/api/users", () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it("should return an empty array when getting /api/users", async () => {
    const response = await request(app).get("/api/users");
    expect(response.body).toStrictEqual([]);
  });
});
```

---

## References

[Express JS with TypeScript - Setup, Examples, Testing](https://www.youtube.com/watch?v=Be7X6QJusJA)<br>
