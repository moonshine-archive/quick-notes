---
title: "NodeJS,PrismaORM,TypeScript,MySQL 기초 튜토리얼"
---

### mysql + sequel ace

#### mysql 설치 및 caching_sha2_password 에러 해결 방법

```zsh
brew install mysql

mysql --version
# 버전 안 나오면 경로 아래와 같이 경로 추가
echo 'export PATH=/opt/homebrew/bin:$PATH' >> ~/.zshrc
$ source ~/.zshrc

# 처음 설치하고 나서는 아래 명령어로 실행하면 password가 없으므로 enter 치면 접속 가능하다.
mysql -u root -p
```

mysql 8버전 이상 사용할 때 무조건 한번쯤 만나는 에러가 `caching_sha2_password` 에러다<br>
8버전 이상부터는 비밀번호 인증 방식이 caching_sha2_password로 변경되었으나, 클라이언트 프로그램 중에는 여전히 mysql_native_password 옵션으로만 가능한 것들이 종종 있기 때문이다.

생성한 계정의 비밀번호 인증 방식을 mysql_native_password로 변경하려면 아래와 같이 수정하면 된다.<br>

mysql 접속 후 `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '새로운 비밀번호';`

- my.cnf에서 설정 방식 자체를 변경할 수도 있다 (my.cnf 파일에 `default-authentication-plugin=mysql_native_password` 내용 추가)

만약 mysql community를 사용한다면 gui에서 `initialize database` 선택한 다음, `use legacy password encryption` 옵션을 선택해주면 된다.

#### mysql 실행 기본 명령어

```zsh
# mysql 실행
brew services start mysql
mysql.server start

# mysql 재시작
brew services  restart mysql

# mysql 종료
brew services stop mysql
mysql.server stop

# mysql 접속
mysql -u root -p # 처음 설치 후 접속 시 비밀번호 없으므로 그냥 enter.

# mysql database 접근
mysql> use mysql;

# 현재 mysql 비밀번호 확인
mysql> select host, user, authentication_string from user;

# 새로운 비밀번호 생성
mysql> create user 'root'@'192.168.0.100' identified with mysql_native_password by 'new_password_you_want';
```

처음 접속하고 나서는 루트 계정의 비밀번호를 설정해야 한다.
루트 계정 정보를 위해서는 mysql db에 접근해야 한다. (mysql이 mysql이라는 db에 이런 정보들을 넣어두고 관리하므로)

(참고로) `sudo mysql_secure_installation`를 입력하면 초기 보안 설정을 안전하게 하도록 만들어진 step에 맞게 비밀번호를 설정할 수 있다.

(참고로)<br>
`mysql.server start` => mysql 서버 자체 실행<br>
`brew services start mysql` => mysql를 백그라운드에서 실행 (데몬 띄우기)

#### mysql 설정 파일(my.cnf) 경로 찾기와 외부접속 허용 세팅

mysql db server의 설정 파일은 `my.cnf`<br>
경로는 터미널에 `mysql --verbose --help | grep my.cnf` 명령어로 검색 가능

- 애플 실리콘이면 보통 `/opt/homebrew/etc/my.cnf` 경로이고, 인텔 맥은 `/usr/local/etc/my.cnf`, 우분투면 `/etc/mysql/mysql.conf.d/mysqld.cnf` => 다 외울 수 없으니 명령어로 검색해야 한다.

처음 mysql을 설치하면 외부접속이 막혀 있다. 외부접속을 허용하려면 my.cnf 파일로 가서 아래와 같이 모든 아이피를 허용하는 방법도 존재한다.

```
# Default Homebrew MySQL server config
[mysqld]
# Only allow connections from localhost
---------- 변경 전 -----------
#bind-address = 127.0.0.1
#mysqlx-bind-address = 127.0.0.1
---------- 변경 후 -----------
bind-address = 0.0.0.0
mysqlx-bind-address = 0.0.0.0
```

허용했다면 재시작하면 된다. (`brew services restart mysql`)<br>
외부접속을 허용했을 경우 localhost로는 접속이 불가능하므로 127.0.0.1로 접속해야 한다.

접속가능한 유저 목록 확인

```sql
use mysql;
select host, user, password from user;
```

외부접속을 위처럼 모두 허용했다면 보안을 위해 계정을 따로 생성하는 게 좋다.

```sql
# 모든 ip 허용
create user '아이디'@'%' IDENTIFIED by '비밀번호'

# localhost만 허용
create user '아이디'@'localhost' IDENTIFIED by '비밀번호'

# 특정 아이피 영역 허용
create user '아이디'@'192.168.0.%' IDENTIFIED by '비밀번호'
```

권한 허용

```sql
grant all privileges on 데이터베이스명.* to '유저명'@'호스트명';


# 모든 데이터베이스 접근 허용
grant all privileges on *.* to '유저명'@'호스트명';

# 모든 데이터베이스 , 모든 호스트 허용
grant all privileges on *.* to '유저명'@'%;
```

#### Can't connect to local MySQL server through socket '/tmp/mysql.sock' 에러 해결 방법

mysql 계정의 비밀번호를 잘못 입력해도 위 에러가 뜨므로 해당 경우의 수도 고려하면 좋다.

- sequel ace에서는 서버가 안 켜져 있으면 `'/tmp/mysql.sock' (2)`로, 비밀번호가 틀리면 `'/tmp/mysql.sock' (1)`로 예외처리를 보여주는 경우의 수가 존재한다.
- 참고로 sequel ace는 sequel pro의 fork 버전(pro가 오픈소스였으나, 2016년 이후 개발이 적극적으로 안 됨. ace는 지금도 활발히 개발되며 최신 버전 macOS와 호환이 잘 된다. 둘 다 macOS용 MySQL db 관리 도구이다.)

mysql 전체를 삭제할 필요는 없고, `/tmp/mysql.sock` 파일만 삭제해주면 된다.<br>
삭제하고 mysql을 재시작하면 된다. (mysql.sock 파일은 mysql 서버 재시작될 때 새로 생성되는 소켓 파일이다.)

```zsh
# /tmp/mysql.sock 파일 삭제
sudo rm /tmp/mysql.sock
# mysql 재시작
brew services start mysql
```

참고로 mysql 자체를 지워야 한다면

```zsh
# mysql 서버 중단
brew services stop mysql
# brew로 mysql 제거
brew uninstall mysql
# mysql 데이터 디렉토리 제거 (데이터 다 날아가므로 주의)
sudo rm -rf /opt/homebrew/var/mysql
# 설정 파일 제거 (os에 따라 경로는 다름. 경로 찾는 방법은 위 내용 참고)
sudo rm /opt/homebrew/etc/my.cnf
# 기타 파일 제거
sudo rm -rf /usr/local/var/mysql
# homebrew에서 mysql 관련 패키지 제거
brew list | grep mysql
brew uninstall [패키지명]
```

#### sequel ace

접속 시 입력 데이터

```
Name: Local
Host: localhost
Username: root
password: {mysql root 계정 비밀번호}
```

root 계정 접속 후 ecommerce 데이터베이스(db 이름은 자유롭게) 생성 후 사용 시작하면 된다.

---

### Prisma 스키마 구조

[/prisma/schema.prisma](https://github.com/moonshine-archive/ts-express-playground/blob/main/nodejs-ts-prisma-orm-mysql/prisma/schema.prisma)

- User: 어드민 유저와 일반 유저를 role로 구분. Order와도 1:N 관계 (한 유저가 여러 주문을 할 수 있음)
- Address: 유저 주소, User와 1:N 관계 (한 유저가 여러 주소를 가질 수 있음)
- Product: 상품 정보. CartItems와 1:N 관계, OrderProduct와 1:N 관계 (텍스트 검색 가능)
- CartItem: 유저 장바구니. User와 Product 간 N:N 관계 구현. (Product와 N:1, User와 N:1)
- Order: 주문 정보. OrderProduct를 통해 Product와 N:N 관계, OrderEvent와 1:N 관계 => 주문 상태 추적. User와 N:1 관계
- OrderProduct: 주문에 포함된 상품과 수량 정보. Order와 N:1, Product와 N:1 => Order와 Product 간 N:N 관계 구현
- OrderEvent: 주문의 상태 변경 이력. Order와 N:1 관계

주요 사용 명령어

```
npx prisma migrate dev --name {마이그레이션 이름}
npx prisma studio
npx prisma generate
```

### Configuration

해당 튜토리얼에서는 `--transpile-only` 옵션을 부여해 타입 체크를 건너 뛰고 트랜스파일만 진행하도록 했다.<br>
타입스크립트보다는 nodejs에 가까운 튜토리얼이 되어 버려서 다소 아쉽다.

```
// nodemon.json
{
  "watch": ["src"],
  "ext": ".js,.ts,.d.ts",
  "exec": "npx ts-node --transpile-only ./src/index.ts"
}
```

### 주요 코드

#### Transaction

[createOrder controller](https://github.com/moonshine-archive/ts-express-playground/blob/main/nodejs-ts-prisma-orm-mysql/src/controllers/orders.ts#L6)

`prismaClient.$transaction` => Prisma에서 제공하는 db 트랜잭션. (여러 db를 하나의 논리적 단위로 묶어 전체가 성공하거나 실패하도록 보장.)

- 원자성 보장: 트랜잭션 내의 모든 작업이 성공적으로 완료되거나, 하나라도 실패하면 전체가 롤백
- 일관성 유지: 데이터베이스의 무결성을 유지하며, 트랜잭션 전후로 데이터베이스가 일관된 상태를 유지.
- 격리성: 동시에 실행되는 다른 트랜잭션으로부터 해당 트랜잭션의 중간 상태를 숨김.
- 콜백 함수 사용: $transaction 메소드는 콜백 함수를 인자로 받음. 이 콜백 함수 내에서 수행되는 모든 데이터베이스 작업이 하나의 트랜잭션으로 처리.
- 트랜잭션 객체: 콜백 함수는 트랜잭션 객체(tx)를 매개변수로 받음. 이 객체를 통해 트랜잭션 내에서 데이터베이스 작업을 수행.
- 에러 처리: 트랜잭션 내에서 에러가 발생하면 자동으로 모든 변경사항이 롤백.
- 성능 최적화: 여러 데이터베이스 작업을 하나의 트랜잭션으로 묶음으로써 데이터베이스 연결 오버헤드를 줄일 수 있음.
- 트랜잭션은 복잡한 비즈니스 로직 구현 시 데이터 정합성 유지하는 데 유용함. 여러 테이블에 걸친 작업이나 조건부 실행이 필요한 경우 사용함.

createOrder 시에 `CartItem 조회 => order 생성 => OrderEvent 생성 => CartItem 비우기`까지의 전 과정을 하나의 원자적 작업으로 처리. => 주문 프로세스의 일관성과 신뢰성 보장

#### Rotes - Middleware - ErrorHandler - Controller 구조

1. 미들웨어에서 auth, admin 체크
2. 컨트롤러는 ErrorHandler로 감싸서 처리
3. 비즈니스 로직은 컨트롤러에서 구현

---

## References

[Building a Production-Ready E-Commerce App: Node.js, Prisma ORM, TypeScript, and MySQL](https://www.youtube.com/watch?v=6-mGtUyfGLw)<br>
