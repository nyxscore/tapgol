# 탑골공원 커뮤니티 앱

탑골공원을 중심으로 한 지역 커뮤니티 앱입니다. 주민들이 소통하고 정보를 공유할 수 있는 플랫폼입니다.

## 🚀 주요 기능

### 👤 사용자 관리
- **회원가입**: 상세한 개인정보 수집 및 Firestore 저장
- **로그인/로그아웃**: Firebase Authentication 활용
- **프로필 관리**: 개인정보 조회 및 수정
- **개인정보 보호**: Firestore 보안 규칙 적용

### 📱 커뮤니티 기능
- **게시판**: 자유로운 소통 공간
- **갤러리**: 사진 공유
- **채팅**: 실시간 메시지 교환
- **알림**: 중요 공지사항 및 업데이트

### 🎮 엔터테인먼트
- **게임**: 바둑, 장기, 고스톱, 테트리스, 윷놀이
- **노래방**: 카라오케 기능
- **운동**: 건강 관리 게시판

## 🛠 기술 스택

- **Frontend**: React 19.1.1, Vite, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **상태관리**: Zustand
- **라우팅**: React Router DOM

## 📋 회원가입 개인정보 필드

### 필수 정보
- 아이디 (3자 이상)
- 비밀번호 (6자 이상)
- 비밀번호 확인
- 이름
- 별명
- 전화번호 (010-1234-5678 형식)

### 선택 정보
- 생년월일
- 성별 (남성/여성/기타)
- 주소
- 관심사 (다중 선택)
  - 탁구, 바둑, 장기, 고스톱, 노래방
  - 운동, 독서, 게임, 음악, 영화
- 프로필 이미지

## 🔐 보안 기능

### Firestore 보안 규칙
- 사용자 정보: 본인만 읽기/쓰기 가능
- 게시글: 인증된 사용자만 접근, 작성자만 수정/삭제
- 채팅: 참여자만 접근 가능
- 알림: 본인만 접근 가능

### 데이터 검증
- 클라이언트 사이드 유효성 검사
- 서버 사이드 데이터 검증
- XSS 및 SQL Injection 방지

## 📁 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Signup.jsx      # 회원가입 폼
│   ├── Profile.jsx     # 프로필 관리
│   └── ...
├── util/
│   ├── firebase.js     # Firebase 설정
│   └── userService.js  # 사용자 관리 유틸리티
├── contexts/
│   └── AuthContext.jsx # 인증 상태 관리
└── ...
```

## 🚀 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**
`.env` 파일을 생성하고 Firebase 설정을 추가:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. **개발 서버 실행**
```bash
npm run dev
```

4. **빌드**
```bash
npm run build
```

## 📊 Firestore 데이터 구조

### users 컬렉션
```javascript
{
  userId: "string",           // 사용자 ID
  name: "string",            // 이름
  nickname: "string",        // 별명
  phone: "string",           // 전화번호
  email: "string",           // 이메일
  birthDate: "string",       // 생년월일
  gender: "string",          // 성별
  address: "string",         // 주소
  interests: ["string"],     // 관심사 배열
  profileImage: "string",    // 프로필 이미지 URL
  isActive: boolean,         // 활성 상태
  role: "string",           // 사용자 역할
  createdAt: timestamp,     // 생성일
  updatedAt: timestamp,     // 수정일
  lastLoginAt: timestamp,   // 마지막 로그인
  signupMethod: "string",   // 가입 방법
  emailVerified: boolean,   // 이메일 인증 여부
  profileComplete: boolean  // 프로필 완성도
}
```

## 🔧 주요 유틸리티 함수

### userService.js
- `getUserProfile(userId)`: 사용자 정보 조회
- `updateUserProfile(userId, data)`: 사용자 정보 업데이트
- `searchUserByNickname(nickname)`: 닉네임으로 사용자 검색
- `searchUsersByInterest(interest)`: 관심사별 사용자 검색
- `checkNicknameAvailability(nickname)`: 닉네임 중복 확인
- `updateUserActivity(userId, activityType)`: 사용자 활동 기록

## 📱 사용자 경험

### 회원가입 프로세스
1. 기본 정보 입력 (아이디, 비밀번호, 이름, 별명, 전화번호)
2. 추가 정보 입력 (생년월일, 성별, 주소, 관심사)
3. 프로필 이미지 업로드 (선택사항)
4. 유효성 검사 및 Firebase 계정 생성
5. Firestore에 상세 정보 저장
6. 가입 완료 및 로그인 페이지 이동

### 프로필 관리
- 개인정보 조회 및 수정
- 관심사 관리
- 프로필 완성도 표시
- 활동 기록 확인

## 🔒 개인정보 보호

- 모든 개인정보는 암호화되어 저장
- 본인만 접근 가능한 보안 규칙 적용
- 데이터 수집 목적 명시
- 사용자 동의 기반 정보 수집

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.
